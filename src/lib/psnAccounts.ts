import pool from '@/lib/db'
import { open, seal } from '@/lib/secretBox'
import { AUTH_FAILED, NOT_CONFIGURED, PsnError } from '@/lib/psnErrors'
import type { PsnAccountInfo, PsnAccountPatch, PsnAccountStatus } from '@/types/psnPool'

/**
 * The PSN service accounts (#178, migrations/047_psn_account_pool.sql): every SQL statement the pool, the
 * admin panel and the alerts run on them. The NPSSO and the tokens are sealed before they reach the
 * database and are never part of what `listPsnAccounts` answers: only `lockPsnTokens` opens them.
 *
 * What Sony allows, measured: the access token lasts 1 h, the refresh token 10 days and is never renewed
 * (refreshing returns the same one), and the NPSSO 60 days from sign-in, fixed. So the NPSSO is the real
 * deadline, and only a person signing in to Sony can make a new one.
 *
 * Sealing: with PSN_SECRET_KEY set, values are sealed with it under the versioned purpose `psn-account:v1`
 * and stored with a `v1:` prefix. Without the prefix a value is the old derivation (NEXTAUTH_SECRET,
 * `psn-credentials`, what migration 047 copied from psn_credentials), still read as before and sealed again
 * with the new key the next time it is written. **A derivation never changes**: `secrets.test.ts` pins both.
 */

export type PsnTokens = { accessToken: string; accessExpiresAt: number; refreshToken: string; refreshExpiresAt: number }
export type PsnSecrets = { npsso: string | null; tokens: PsnTokens | null }

/** What the pool needs of an account to call Sony with it. */
export type PoolAccount = { id: number; label: string; ratePerMin: number }
export type PsnLease = { account: PoolAccount; slot: number }
/** How a call went, for the account's health and its stats. */
export type PsnOutcome = 'ok' | 'rate-limited' | 'auth' | 'server'
/** Whether a call can find an account: none set up, all slots taken for a moment, or none usable now. */
export type PsnPoolState = 'empty' | 'busy' | 'resting'

/** A sign-in that passed the test: what adding or renewing an account stores. */
export type PsnSignIn = { npsso: string; expiresAt: number; tokens: PsnTokens; onlineId: string; avatarUrl: string | null }

const LEGACY_PURPOSE = 'psn-credentials'
const PURPOSE = 'psn-account:v1'
const V1 = 'v1:'
/** A lease is one call; it frees itself after this if the instance dies mid-call. */
const LEASE_SECONDS = 30
const SSO_COOKIE_URL = 'https://ca.account.sony.com/api/v1/ssocookie'
const TIMEOUT_MS = 8_000

const secretKey = () => process.env.PSN_SECRET_KEY?.trim() || null

export function sealPsn(plain: string): string {
  const key = secretKey()
  return key ? V1 + seal(plain, PURPOSE, key) : seal(plain, LEGACY_PURPOSE)
}

export function openPsn(stored: string | null | undefined): string | null {
  if (!stored) return null
  if (!stored.startsWith(V1)) return open(stored, LEGACY_PURPOSE)
  const key = secretKey()
  return key ? open(stored.slice(V1.length), PURPOSE, key) : null
}

const ms = (d: Date | string | null | undefined) => (d ? new Date(d).getTime() : null)

export { daysUntil as daysLeft } from '@/utils/psnPool'

/**
 * When an NPSSO expires, asked of Sony itself (the page an admin copies it from answers with its remaining
 * life). Null when Sony does not accept it: expired, mistyped, or signed out.
 */
export async function npssoExpiry(npsso: string): Promise<number | null> {
  try {
    const res = await fetch(SSO_COOKIE_URL, { headers: { Cookie: `npsso=${npsso}` }, cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) return null
    const body = (await res.json()) as { npsso?: string; expires_in?: number }
    if (body.npsso !== npsso || typeof body.expires_in !== 'number') return null
    return Date.now() + body.expires_in * 1000
  } catch (err) {
    console.error('[psnAccounts] could not reach Sony', err instanceof Error ? err.message : 'unknown')
    return null
  }
}

// ---- The pool's side ----------------------------------------------------------------------------------------

/**
 * Takes a free slot on a usable account, never one of `exclude`: weighted by `weight` (an exponential race,
 * so a weight of 2 is picked about twice as often), and an account with more free slots has more chances.
 * Null when none is free; two instances racing for one slot get it once.
 */
export async function leasePsnAccount(exclude: number[]): Promise<PsnLease | null> {
  const { rows } = await pool.query(
    `WITH pick AS (
       SELECT a.id, s.slot
         FROM psn_service_accounts a
         CROSS JOIN LATERAL generate_series(0, a.concurrency - 1) AS s(slot)
         LEFT JOIN psn_account_leases l ON l.account_id = a.id AND l.slot = s.slot
        WHERE a.status = 'active' AND a.npsso IS NOT NULL
          AND (a.cooldown_until IS NULL OR a.cooldown_until <= NOW())
          AND (l.leased_until IS NULL OR l.leased_until < NOW())
          AND NOT (a.id = ANY($1::int[]))
        ORDER BY -LN(1 - random()) / a.weight
        LIMIT 1
     ), leased AS (
       INSERT INTO psn_account_leases (account_id, slot, leased_until)
       SELECT id, slot, NOW() + make_interval(secs => $2) FROM pick
       ON CONFLICT (account_id, slot) DO UPDATE SET leased_until = EXCLUDED.leased_until
         WHERE psn_account_leases.leased_until < NOW()
       RETURNING account_id, slot
     )
     SELECT l.account_id, l.slot, a.label, a.rate_per_min
       FROM leased l JOIN psn_service_accounts a ON a.id = l.account_id`,
    [exclude, LEASE_SECONDS],
  )
  const row = rows[0]
  return row ? { account: { id: row.account_id, label: row.label, ratePerMin: row.rate_per_min }, slot: row.slot } : null
}

/** Why no slot was free, leaving out `exclude`. */
export async function psnPoolState(exclude: number[] = []): Promise<PsnPoolState> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE npsso IS NOT NULL)::int AS configured,
            COUNT(*) FILTER (WHERE status = 'active' AND npsso IS NOT NULL AND NOT (id = ANY($1::int[]))
                               AND (cooldown_until IS NULL OR cooldown_until <= NOW()))::int AS ready
       FROM psn_service_accounts`,
    [exclude],
  )
  const { configured = 0, ready = 0 } = rows[0] ?? {}
  return configured === 0 ? 'empty' : ready > 0 ? 'busy' : 'resting'
}

/** Gives a slot back without counting a call (the account's budget refused it: Sony was not asked). */
export async function releasePsnLease(lease: PsnLease): Promise<void> {
  await pool.query('DELETE FROM psn_account_leases WHERE account_id = $1 AND slot = $2', [lease.account.id, lease.slot])
}

/**
 * Gives the slot back and records how the call went: an answer resets the account's failures; Sony's
 * "too many requests" twice in a row rests the account for a minute, doubling up to five.
 */
export async function finishPsnLease(lease: PsnLease, outcome: PsnOutcome): Promise<void> {
  await pool.query(
    `WITH freed AS (
       DELETE FROM psn_account_leases WHERE account_id = $1 AND slot = $2
     ), account AS (
       UPDATE psn_service_accounts SET
         last_used_at = NOW(),
         last_ok_at = CASE WHEN $3 = 'ok' THEN NOW() ELSE last_ok_at END,
         last_error = CASE WHEN $3 = 'ok' THEN NULL ELSE $3 END,
         failure_count = CASE WHEN $3 = 'ok' THEN 0 WHEN $3 = 'rate-limited' THEN failure_count + 1 ELSE failure_count END,
         cooldown_until = CASE WHEN $3 = 'rate-limited' AND failure_count >= 1
                               THEN NOW() + make_interval(secs => LEAST(300, 60 * POWER(2, failure_count - 1)))
                               ELSE cooldown_until END
       WHERE id = $1
     )
     INSERT INTO psn_account_stats (account_id, minute, calls, ok, rate_limited, auth_errors, server_errors)
     VALUES ($1, date_trunc('minute', NOW()), 1, ($3 = 'ok')::int, ($3 = 'rate-limited')::int, ($3 = 'auth')::int, ($3 = 'server')::int)
     ON CONFLICT (account_id, minute) DO UPDATE SET
       calls = psn_account_stats.calls + 1,
       ok = psn_account_stats.ok + EXCLUDED.ok,
       rate_limited = psn_account_stats.rate_limited + EXCLUDED.rate_limited,
       auth_errors = psn_account_stats.auth_errors + EXCLUDED.auth_errors,
       server_errors = psn_account_stats.server_errors + EXCLUDED.server_errors`,
    [lease.account.id, lease.slot, outcome],
  )
}

type SecretRow = {
  npsso: string | null
  access_token: string | null
  access_expires_at: Date | null
  refresh_token: string | null
  refresh_expires_at: Date | null
}

function toSecrets(row: SecretRow): PsnSecrets {
  const accessToken = openPsn(row.access_token)
  const refreshToken = openPsn(row.refresh_token)
  return {
    npsso: openPsn(row.npsso),
    tokens:
      accessToken && refreshToken && row.access_expires_at && row.refresh_expires_at
        ? { accessToken, accessExpiresAt: ms(row.access_expires_at)!, refreshToken, refreshExpiresAt: ms(row.refresh_expires_at)! }
        : null,
  }
}

/**
 * The account's tokens, decided under `SELECT … FOR UPDATE` on its row, so two instances never refresh one
 * account at once: the second waits, then finds the first's tokens. New tokens are stored (and an NPSSO
 * still under the old derivation sealed again with PSN_SECRET_KEY). A refused sign-in quarantines the account.
 */
export async function lockPsnTokens(id: number, decide: (secrets: PsnSecrets) => Promise<PsnTokens>): Promise<PsnTokens> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      'SELECT npsso, access_token, access_expires_at, refresh_token, refresh_expires_at FROM psn_service_accounts WHERE id = $1 FOR UPDATE',
      [id],
    )
    if (!rows[0]) throw new PsnError('PSN account removed', NOT_CONFIGURED)
    const secrets = toSecrets(rows[0])
    const tokens = await decide(secrets).catch(async (err: unknown) => {
      if (err instanceof PsnError && err.code === AUTH_FAILED) {
        await client.query(
          `UPDATE psn_service_accounts SET status = 'quarantined', last_error = 'sign-in refused',
             access_token = NULL, access_expires_at = NULL WHERE id = $1`,
          [id],
        )
        await client.query('COMMIT')
      }
      throw err
    })
    if (tokens.accessToken !== secrets.tokens?.accessToken) await storeTokens(client, id, tokens, rows[0].npsso, secrets.npsso)
    await client.query('COMMIT')
    return tokens
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

async function storeTokens(client: Awaited<ReturnType<typeof pool.connect>>, id: number, tokens: PsnTokens, sealedNpsso: string | null, npsso: string | null) {
  const reseal = npsso && secretKey() && !sealedNpsso?.startsWith(V1) ? sealPsn(npsso) : sealedNpsso
  await client.query(
    `UPDATE psn_service_accounts SET npsso = $2,
       access_token = $3, access_expires_at = to_timestamp($4 / 1000.0),
       refresh_token = $5, refresh_expires_at = to_timestamp($6 / 1000.0)
     WHERE id = $1`,
    [id, reseal, sealPsn(tokens.accessToken), tokens.accessExpiresAt, sealPsn(tokens.refreshToken), tokens.refreshExpiresAt],
  )
}

/** Sony refused the account's access token: the next call signs in again (refresh token, then NPSSO). */
export async function dropPsnAccessToken(id: number): Promise<void> {
  await pool.query('UPDATE psn_service_accounts SET access_token = NULL, access_expires_at = NULL WHERE id = $1', [id])
}

// ---- Setting the pool up ------------------------------------------------------------------------------------

/** The same copy as migration 047: today's psn_credentials row becomes PSN-1 while the pool is empty. */
const SEED_FROM_LEGACY = `
  INSERT INTO psn_service_accounts
    (label, npsso, npsso_expires_at, refresh_token, refresh_expires_at, access_token, access_expires_at,
     renewed_at, renewed_by, warned_at, created_by)
  SELECT 'PSN-1', npsso, npsso_expires_at, refresh_token, refresh_expires_at, access_token, access_expires_at,
         updated_at, updated_by, warned_at, 'psn_credentials'
    FROM psn_credentials
   WHERE id = 1 AND npsso IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM psn_service_accounts)`

/**
 * A pool with no account takes today's: the psn_credentials row, else the PSN_NPSSO variable (with the expiry
 * Sony gives), as PSN-1. Nothing happens once any account exists.
 */
export async function seedPsnPool(): Promise<void> {
  await pool.query(SEED_FROM_LEGACY).catch((err: { code?: string }) => {
    if (err?.code !== '42P01') throw err // psn_credentials gone: nothing to copy
  })
  const envNpsso = process.env.PSN_NPSSO?.trim()
  if (!envNpsso || (await psnPoolState()) !== 'empty') return
  await pool.query(
    `INSERT INTO psn_service_accounts (label, npsso, npsso_expires_at, created_by)
     SELECT 'PSN-1', $1, CASE WHEN $2::float8 IS NULL THEN NULL ELSE to_timestamp($2::float8 / 1000.0) END, 'PSN_NPSSO'
      WHERE NOT EXISTS (SELECT 1 FROM psn_service_accounts)`,
    [sealPsn(envNpsso), await npssoExpiry(envNpsso)],
  )
}

// ---- The admin panel's side ---------------------------------------------------------------------------------

type InfoRow = {
  id: number
  label: string
  hint: string | null
  online_id: string | null
  avatar_url: string | null
  status: PsnAccountStatus
  weight: number
  concurrency: number
  rate_per_min: number
  npsso_expires_at: Date | null
  renewed_at: Date | null
  renewed_by: string | null
  last_ok_at: Date | null
  last_error: string | null
  cooldown_until: Date | null
  canary_at: Date | null
  canary_ok: boolean | null
  warned_at: Date | null
  calls: number
  rate_limited: number
}

function toInfo(r: InfoRow): PsnAccountInfo {
  return {
    id: r.id,
    label: r.label,
    hint: r.hint,
    onlineId: r.online_id,
    avatarUrl: r.avatar_url,
    status: r.status,
    weight: r.weight,
    concurrency: r.concurrency,
    ratePerMin: r.rate_per_min,
    npssoExpiresAt: ms(r.npsso_expires_at),
    renewedAt: ms(r.renewed_at),
    renewedBy: r.renewed_by,
    lastOkAt: ms(r.last_ok_at),
    lastError: r.last_error,
    cooldownUntil: ms(r.cooldown_until),
    canaryAt: ms(r.canary_at),
    canaryOk: r.canary_ok,
    warnedAt: ms(r.warned_at),
    callsLastHour: Number(r.calls),
    rateLimitedLastHour: Number(r.rate_limited),
  }
}

/** A database to read the pool from: this environment's, or pre's from production (psnPoolStatus). */
export type PsnDb = Pick<typeof pool, 'query'>

/** Every account, by label, with its calls in the last hour. No secret is selected. */
export async function listPsnAccounts(db: PsnDb = pool): Promise<PsnAccountInfo[]> {
  const { rows } = await db.query(
    `SELECT a.id, a.label, a.hint, a.online_id, a.avatar_url, a.status, a.weight, a.concurrency, a.rate_per_min,
            a.npsso_expires_at, a.renewed_at, a.renewed_by, a.last_ok_at, a.last_error, a.cooldown_until,
            a.canary_at, a.canary_ok, a.warned_at,
            COALESCE(s.calls, 0) AS calls, COALESCE(s.rate_limited, 0) AS rate_limited
       FROM psn_service_accounts a
       LEFT JOIN (
         SELECT account_id, SUM(calls) AS calls, SUM(rate_limited) AS rate_limited
           FROM psn_account_stats WHERE minute > NOW() - INTERVAL '1 hour' GROUP BY account_id
       ) s ON s.account_id = a.id
      ORDER BY a.label`,
  )
  return (rows as InfoRow[]).map(toInfo)
}

/** What the canary needs of one account; null when it is gone. */
export async function loadPoolAccount(id: number): Promise<PoolAccount | null> {
  const { rows } = await pool.query('SELECT id, label, rate_per_min FROM psn_service_accounts WHERE id = $1', [id])
  return rows[0] ? { id: rows[0].id, label: rows[0].label, ratePerMin: rows[0].rate_per_min } : null
}

/** A new account, active at once. A label already used throws Postgres' 23505. */
export async function insertPsnAccount(input: { label: string; hint: string | null; weight: number; by: string }, signIn: PsnSignIn): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO psn_service_accounts
       (label, hint, weight, online_id, avatar_url, npsso, npsso_expires_at, access_token, access_expires_at,
        refresh_token, refresh_expires_at, renewed_at, renewed_by, created_by, canary_at, canary_ok)
     VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7 / 1000.0), $8, to_timestamp($9 / 1000.0), $10, to_timestamp($11 / 1000.0),
             NOW(), $12, $12, NOW(), true)
     RETURNING id`,
    [input.label, input.hint, input.weight, ...signInValues(signIn), input.by],
  )
  return rows[0].id
}

function signInValues(s: PsnSignIn) {
  return [s.onlineId, s.avatarUrl, sealPsn(s.npsso), s.expiresAt, sealPsn(s.tokens.accessToken), s.tokens.accessExpiresAt, sealPsn(s.tokens.refreshToken), s.tokens.refreshExpiresAt]
}

/**
 * A new NPSSO for an account: everything from the old one goes, a quarantined account is active again (a paused
 * or draining one stays as the admin left it), and its expiry alerts start over. False when the account is gone.
 */
export async function renewPsnAccount(id: number, by: string, signIn: PsnSignIn): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE psn_service_accounts SET
       online_id = $2, avatar_url = $3, npsso = $4, npsso_expires_at = to_timestamp($5 / 1000.0),
       access_token = $6, access_expires_at = to_timestamp($7 / 1000.0), refresh_token = $8, refresh_expires_at = to_timestamp($9 / 1000.0),
       renewed_at = NOW(), renewed_by = $10, warned_at = NULL, failure_count = 0, cooldown_until = NULL, last_error = NULL,
       canary_at = NOW(), canary_ok = true,
       status = CASE WHEN status = 'quarantined' THEN 'active' ELSE status END
     WHERE id = $1`,
    [id, ...signInValues(signIn), by],
  )
  if (rowCount) await pool.query('DELETE FROM psn_alert_state WHERE account_id = $1', [id])
  return rowCount === 1
}

/** Changes what an admin may change; a resumed account also forgets its cooldown. False when it is gone. */
export async function updatePsnAccount(id: number, patch: PsnAccountPatch): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE psn_service_accounts SET
       status = COALESCE($2, status),
       weight = COALESCE($3, weight),
       concurrency = COALESCE($4, concurrency),
       rate_per_min = COALESCE($5, rate_per_min),
       hint = CASE WHEN $6::boolean THEN $7 ELSE hint END,
       cooldown_until = CASE WHEN $2 = 'active' THEN NULL ELSE cooldown_until END,
       failure_count = CASE WHEN $2 = 'active' THEN 0 ELSE failure_count END
     WHERE id = $1`,
    [id, patch.status ?? null, patch.weight ?? null, patch.concurrency ?? null, patch.ratePerMin ?? null, patch.hint !== undefined, patch.hint ?? null],
  )
  return rowCount === 1
}

/** Removes an account and its secrets for good (its leases and stats go with it). False when it was not there. */
export async function deletePsnAccount(id: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM psn_service_accounts WHERE id = $1', [id])
  if (rowCount) await pool.query('DELETE FROM psn_alert_state WHERE account_id = $1', [id])
  return rowCount === 1
}

/** The canary's answer: whether the account could read its own profile, and who it is. */
export async function recordPsnCanary(id: number, profile: { onlineId: string; avatarUrl: string | null } | null): Promise<void> {
  await pool.query(
    `UPDATE psn_service_accounts SET canary_at = NOW(), canary_ok = $2,
       online_id = COALESCE($3, online_id), avatar_url = COALESCE($4, avatar_url)
     WHERE id = $1`,
    [id, profile !== null, profile?.onlineId ?? null, profile?.avatarUrl ?? null],
  )
}

/** Accounts whose canary is older than `maxAgeMs` (or never ran), active ones only, oldest first. */
export async function canaryDue(maxAgeMs: number): Promise<PoolAccount[]> {
  const { rows } = await pool.query(
    `SELECT id, label, rate_per_min FROM psn_service_accounts
      WHERE status = 'active' AND npsso IS NOT NULL
        AND (canary_at IS NULL OR canary_at < NOW() - make_interval(secs => $1))
      ORDER BY canary_at NULLS FIRST`,
    [maxAgeMs / 1000],
  )
  return rows.map((r: { id: number; label: string; rate_per_min: number }) => ({ id: r.id, label: r.label, ratePerMin: r.rate_per_min }))
}

/** A draining account with no call in flight takes no more: it is paused. Old stats go. */
export async function tidyPsnPool(): Promise<void> {
  await pool.query(
    `UPDATE psn_service_accounts a SET status = 'paused'
      WHERE status = 'draining'
        AND NOT EXISTS (SELECT 1 FROM psn_account_leases l WHERE l.account_id = a.id AND l.leased_until > NOW())`,
  )
  await pool.query(`DELETE FROM psn_account_stats WHERE minute < NOW() - INTERVAL '14 days'`)
}

export async function markPsnWarned(ids: number[]): Promise<void> {
  await pool.query('UPDATE psn_service_accounts SET warned_at = NOW() WHERE id = ANY($1::int[])', [ids])
}
