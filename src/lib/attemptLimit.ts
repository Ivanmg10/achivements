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
 */
export type AttemptScope = 'signup' | 'reset' | 'login' | 'login-ip' | 'password-check'

const LIMITS: Record<AttemptScope, { max: number; windowMinutes: number }> = {
  signup: { max: 5, windowMinutes: 60 },
  reset: { max: 5, windowMinutes: 15 },
  login: { max: 10, windowMinutes: 15 },
  'login-ip': { max: 50, windowMinutes: 15 },
  'password-check': { max: 10, windowMinutes: 15 },
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
  const { max, windowMinutes } = LIMITS[scope]
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS recent
         FROM signup_attempts
        WHERE scope = $1 AND address = $2 AND created_at > NOW() - ($3 || ' minutes')::interval`,
      [scope, address, String(windowMinutes)],
    )
    return (rows[0]?.recent ?? 0) >= max
  } catch (err) {
    console.error('[attemptLimit]', scope, err)
    return false
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

/** Records an attempt and says whether it is allowed. */
export async function allowAttempt(scope: AttemptScope, address: string): Promise<boolean> {
  if (await isLimited(scope, address)) return false
  await recordAttempt(scope, address)
  return true
}
