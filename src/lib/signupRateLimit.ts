import pool from '@/lib/db'

/**
 * A brake on account creation, per client address.
 *
 * Registration is open, so the endpoint writes a row for anyone who asks.
 * The count lives in the database rather than in memory, so the limit still
 * holds when the app runs as several serverless instances.
 */
const WINDOW_MINUTES = 60
const MAX_PER_WINDOW = 5

/** The address Vercel and most proxies put the real client in. */
export function clientAddress(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Records an attempt and says whether it is allowed. A database that will not
 * answer must not stop people signing up, so a failure here lets them through.
 */
export async function allowSignup(address: string): Promise<boolean> {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS recent
         FROM signup_attempts
        WHERE address = $1 AND created_at > NOW() - ($2 || ' minutes')::interval`,
      [address, String(WINDOW_MINUTES)],
    )
    if ((rows[0]?.recent ?? 0) >= MAX_PER_WINDOW) return false

    await pool.query('INSERT INTO signup_attempts (address) VALUES ($1)', [address])

    // Cheap housekeeping: drop what no longer counts, now and then.
    if (Math.random() < 0.05) {
      await pool.query(`DELETE FROM signup_attempts WHERE created_at < NOW() - INTERVAL '1 day'`)
    }
    return true
  } catch (err) {
    console.error('[signupRateLimit]', err)
    return true
  }
}
