import pool from '@/lib/db'
import { open, seal } from '@/lib/secretBox'

/**
 * The app's PSN credentials (migrations/026_psn_credentials.sql): the NPSSO
 * an admin pasted, and the tokens made from it. Secrets are sealed with
 * secretBox before they reach the database.
 *
 * What Sony allows, measured: the access token lasts 1 h, the refresh token
 * 10 days and is never renewed (refreshing returns the same one), and the
 * NPSSO 60 days from sign-in, fixed. So the NPSSO is the real deadline, and
 * only a person signing in to Sony can make a new one.
 */

const PURPOSE = 'psn-credentials'
const SSO_COOKIE_URL = 'https://ca.account.sony.com/api/v1/ssocookie'

export type PsnTokens = { accessToken: string; accessExpiresAt: number; refreshToken: string; refreshExpiresAt: number }

export type PsnCredentials = {
  npsso: string | null
  npssoExpiresAt: number | null
  tokens: PsnTokens | null
  updatedAt: number | null
  updatedBy: string | null
  warnedAt: number | null
}

type Row = {
  npsso: string | null
  npsso_expires_at: Date | null
  refresh_token: string | null
  refresh_expires_at: Date | null
  access_token: string | null
  access_expires_at: Date | null
  updated_at: Date | null
  updated_by: string | null
  warned_at: Date | null
}

const ms = (d: Date | null) => (d ? new Date(d).getTime() : null)

/** The stored credentials, or null when there are none (or the table is missing). */
export async function loadPsnCredentials(): Promise<PsnCredentials | null> {
  const { rows } = await pool.query('SELECT * FROM psn_credentials WHERE id = 1')
  const row = rows[0] as Row | undefined
  if (!row) return null
  const accessToken = open(row.access_token, PURPOSE)
  const refreshToken = open(row.refresh_token, PURPOSE)
  return {
    npsso: open(row.npsso, PURPOSE),
    npssoExpiresAt: ms(row.npsso_expires_at),
    tokens:
      accessToken && refreshToken && row.access_expires_at && row.refresh_expires_at
        ? { accessToken, accessExpiresAt: ms(row.access_expires_at)!, refreshToken, refreshExpiresAt: ms(row.refresh_expires_at)! }
        : null,
    updatedAt: ms(row.updated_at),
    updatedBy: row.updated_by,
    warnedAt: ms(row.warned_at),
  }
}

/** Keeps the tokens made from the NPSSO, so a cold start does not spend a new exchange. */
export async function savePsnTokens(tokens: PsnTokens): Promise<void> {
  await pool.query(
    `INSERT INTO psn_credentials (id, access_token, access_expires_at, refresh_token, refresh_expires_at)
     VALUES (1, $1, to_timestamp($2 / 1000.0), $3, to_timestamp($4 / 1000.0))
     ON CONFLICT (id) DO UPDATE SET access_token = EXCLUDED.access_token, access_expires_at = EXCLUDED.access_expires_at,
       refresh_token = EXCLUDED.refresh_token, refresh_expires_at = EXCLUDED.refresh_expires_at`,
    [seal(tokens.accessToken, PURPOSE), tokens.accessExpiresAt, seal(tokens.refreshToken, PURPOSE), tokens.refreshExpiresAt],
  )
}

/** A new NPSSO replaces everything: the old tokens came from the old one. */
export async function savePsnNpsso(npsso: string, expiresAt: number | null, updatedBy: string | null): Promise<void> {
  await pool.query(
    `INSERT INTO psn_credentials (id, npsso, npsso_expires_at, updated_at, updated_by)
     VALUES (1, $1, CASE WHEN $2::float8 IS NULL THEN NULL ELSE to_timestamp($2::float8 / 1000.0) END, NOW(), $3)
     ON CONFLICT (id) DO UPDATE SET npsso = EXCLUDED.npsso, npsso_expires_at = EXCLUDED.npsso_expires_at,
       updated_at = NOW(), updated_by = EXCLUDED.updated_by, warned_at = NULL,
       access_token = NULL, access_expires_at = NULL, refresh_token = NULL, refresh_expires_at = NULL`,
    [seal(npsso, PURPOSE), expiresAt, updatedBy],
  )
}

export async function markPsnWarned(): Promise<void> {
  await pool.query('UPDATE psn_credentials SET warned_at = NOW() WHERE id = 1')
}

/**
 * When an NPSSO expires, asked of Sony itself (the same page an admin copies
 * it from answers with its remaining life). Null when Sony does not accept
 * it — expired, mistyped, or signed out.
 */
export async function npssoExpiry(npsso: string): Promise<number | null> {
  try {
    const res = await fetch(SSO_COOKIE_URL, { headers: { Cookie: `npsso=${npsso}` }, cache: 'no-store' })
    if (!res.ok) return null
    const body = (await res.json()) as { npsso?: string; expires_in?: number }
    if (body.npsso !== npsso || typeof body.expires_in !== 'number') return null
    return Date.now() + body.expires_in * 1000
  } catch (err) {
    console.error('[psnCredentials] could not reach Sony', err)
    return null
  }
}

/** Whole days left before a deadline, never negative. */
export function daysLeft(at: number | null, now = Date.now()): number | null {
  return at === null ? null : Math.max(0, Math.floor((at - now) / 86_400_000))
}
