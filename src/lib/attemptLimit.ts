import pool from '@/lib/db'

/**
 * A brake on the endpoints anyone can call: creating an account, asking for a
 * password reset, and signing in. Counted in the database rather than in
 * memory, so the limit still holds when the app runs as several serverless
 * instances.
 *
 * Sign-in counts only failures, twice: per address + username, which stops
 * guessing one account's password, and per address alone, which stops trying
 * one password against many accounts. Neither is per username alone — that
 * would let anyone lock a stranger out of their own account.
 *
 * 'password-check' counts wrong current passwords typed by someone already
 * signed in (changing the password or the email), keyed by the account: it
 * stops a stolen session from guessing its way to the password.
 *
 * 'user-search' counts searches for other users per account: it stops a
 * signed-up account from walking the whole user list. 'follow' counts follows
 * per account, for the same reason: a follow also says whether a name exists.
 *
 * 'avatar' counts uploads per account: an avatar is small, but each one is a
 * write of up to 512 KB to the database.
 *
 * 'psn-score' counts the PSN games read for Vault Points, for the whole app
 * (address 'app'): PSN is one app account for everyone, so the score fill goes
 * gently whoever it is for. 300 games is 600 calls to Sony in 15 minutes.
 */
export type AttemptScope = 'signup' | 'reset' | 'login' | 'login-ip' | 'password-check' | 'avatar' | 'user-search' | 'follow' | 'psn-score' | 'xbox-upstream' | 'ra-check'

const LIMITS: Record<AttemptScope, { max: number; windowMinutes: number }> = {
  signup: { max: 5, windowMinutes: 60 },
  reset: { max: 5, windowMinutes: 15 },
  login: { max: 10, windowMinutes: 15 },
  'login-ip': { max: 50, windowMinutes: 15 },
  'password-check': { max: 10, windowMinutes: 15 },
  avatar: { max: 20, windowMinutes: 60 },
  'user-search': { max: 60, windowMinutes: 5 },
  follow: { max: 60, windowMinutes: 5 },
  'psn-score': { max: 300, windowMinutes: 15 },
  // One OpenXBL key and plan are shared by every route and score job in this environment.
  'xbox-upstream': { max: 150, windowMinutes: 60 },
  // Checking an RA key before signing up: signed out, so per address, and few, or it would test stolen keys.
  'ra-check': { max: 10, windowMinutes: 15 },
}

type HeaderSource = Headers | Record<string, string | string[] | undefined>

function readHeader(headers: HeaderSource, name: string): string | null {
  if (headers instanceof Headers) return headers.get(name)
  const value = headers[name]
  return (Array.isArray(value) ? value[0] : value) ?? null
}

/**
 * The address Vercel and most proxies put the real client in. On Vercel the
 * platform sets x-forwarded-for itself, so a client cannot choose its own.
 */
export function clientAddress(headers: HeaderSource): string {
  const forwarded = readHeader(headers, 'x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return readHeader(headers, 'x-real-ip') ?? 'unknown'
}

/**
 * Whether the address has used up its attempts in the window. A database that
 * will not answer must not lock people out, so a failure here lets them through.
 */
export async function isLimited(scope: AttemptScope, address: string): Promise<boolean> {
  return (await recentAttempts(scope, address)) >= LIMITS[scope].max
}

/** Attempts in the window. A database that will not answer counts as none. */
async function recentAttempts(scope: AttemptScope, address: string, failOpen = true): Promise<number> {
  const { windowMinutes } = LIMITS[scope]
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS recent
         FROM signup_attempts
        WHERE scope = $1 AND address = $2 AND created_at > NOW() - ($3 || ' minutes')::interval`,
      [scope, address, String(windowMinutes)],
    )
    return rows[0]?.recent ?? 0
  } catch (err) {
    if (!failOpen) throw err
    console.error('[attemptLimit]', scope, err)
    return 0
  }
}

/** Counts one attempt against the address. */
export async function recordAttempt(scope: AttemptScope, address: string): Promise<void> {
  try {
    await pool.query('INSERT INTO signup_attempts (scope, address) VALUES ($1, $2)', [scope, address])

    // Cheap housekeeping: drop what no longer counts, now and then.
    if (Math.random() < 0.05) {
      await pool.query(`DELETE FROM signup_attempts WHERE created_at < NOW() - INTERVAL '1 day'`)
    }
  } catch (err) {
    console.error('[attemptLimit]', scope, err)
  }
}

async function allowXboxUpstream(address: string): Promise<boolean> {
  let insertedId: number | null = null
  try {
    const { rows } = await pool.query('INSERT INTO signup_attempts (scope, address) VALUES ($1, $2) RETURNING id', ['xbox-upstream', address])
    insertedId = rows[0]?.id ?? null
    const recent = await recentAttempts('xbox-upstream', address, false)
    if (recent <= LIMITS['xbox-upstream'].max) return true
    if (insertedId !== null) await pool.query('DELETE FROM signup_attempts WHERE id = $1', [insertedId])
    return false
  } catch (err) {
    // Quota has a real cost: unlike sign-up limiting, an unavailable counter fails closed.
    if (insertedId !== null) await pool.query('DELETE FROM signup_attempts WHERE id = $1', [insertedId]).catch(() => {})
    console.error('[attemptLimit] xbox-upstream', err)
    return false
  }
}

/**
 * Records an attempt and says whether it is allowed. Recording comes first:
 * each insert is committed before its count runs, so requests racing each
 * other all see one another, and a burst cannot slip past the limit together.
 * Refused attempts count too, which only keeps a hammering address out longer.
 */
export async function allowAttempt(scope: AttemptScope, address: string): Promise<boolean> {
  if (scope === 'xbox-upstream') return allowXboxUpstream(address)
  await recordAttempt(scope, address)
  return (await recentAttempts(scope, address)) <= LIMITS[scope].max
}
