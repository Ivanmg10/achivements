import { createHash, randomBytes } from 'crypto'
import pool from '@/lib/db'

/**
 * Password reset tokens. The token travels only in the email; the database
 * keeps its SHA-256 hash, so a leak of the table cannot reset anyone's
 * password. A token lasts an hour and works once.
 */
const TTL_MINUTES = 60

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Issues a token for a user, retiring any they already had. */
export async function createResetToken(userId: number): Promise<string> {
  const token = randomBytes(32).toString('hex')
  await pool.query('DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL', [userId])
  await pool.query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)`,
    [userId, hashToken(token), String(TTL_MINUTES)],
  )
  return token
}

/** The user a live token belongs to, or null when it is unknown, used or stale. */
export async function userForToken(token: string): Promise<number | null> {
  const { rows } = await pool.query(
    `SELECT user_id FROM password_resets
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [hashToken(token)],
  )
  return rows[0]?.user_id ?? null
}

/** Marks the token spent, so the same link cannot be used twice. */
export async function consumeToken(token: string): Promise<void> {
  await pool.query('UPDATE password_resets SET used_at = NOW() WHERE token_hash = $1', [hashToken(token)])
}

/** The link that goes in the email. */
export function resetUrl(token: string): string {
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? ''
  return `${base}/resetPassword?token=${token}`
}
