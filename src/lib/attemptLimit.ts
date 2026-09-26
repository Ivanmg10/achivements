import pool from '@/lib/db'

/**
 * A brake on the endpoints anyone can call: creating an account and asking
 * for a password reset. Counted in the database rather than in memory, so the
 * limit still holds when the app runs as several serverless instances.
 */
export type AttemptScope = 'signup' | 'reset'

const LIMITS: Record<AttemptScope, { max: number; windowMinutes: number }> = {
  signup: { max: 5, windowMinutes: 60 },
  reset: { max: 5, windowMinutes: 15 },
}

/** The address Vercel and most proxies put the real client in. */
export function clientAddress(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Records an attempt and says whether it is allowed. A database that will not
 * answer must not lock people out, so a failure here lets them through.
 */
export async function allowAttempt(scope: AttemptScope, address: string): Promise<boolean> {
  const { max, windowMinutes } = LIMITS[scope]
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS recent
         FROM signup_attempts
        WHERE scope = $1 AND address = $2 AND created_at > NOW() - ($3 || ' minutes')::interval`,
      [scope, address, String(windowMinutes)],
    )
    if ((rows[0]?.recent ?? 0) >= max) return false

    await pool.query('INSERT INTO signup_attempts (scope, address) VALUES ($1, $2)', [scope, address])

    // Cheap housekeeping: drop what no longer counts, now and then.
    if (Math.random() < 0.05) {
      await pool.query(`DELETE FROM signup_attempts WHERE created_at < NOW() - INTERVAL '1 day'`)
    }
    return true
  } catch (err) {
    console.error('[attemptLimit]', scope, err)
    return true
  }
}
