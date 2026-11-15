import crypto from 'crypto'
import pool from '@/lib/db'
import { reserveAttempt } from '@/lib/attemptLimit'
import { open, seal } from '@/lib/secretBox'
import { matchingStep, newTotpSecret, totpUri } from '@/lib/totp'

/**
 * The admin panel's second factor. A stolen or phished password opens nothing
 * alone: unlocking also takes a code from the admin's authenticator app, or one
 * of the recovery codes given at enrolment. An admin with none yet enrols on
 * their next unlock (password first), so the panel never opens without it.
 */
const PURPOSE = 'admin-totp'
const RECOVERY_CODES = 8

export type SecondFactor =
  | { state: 'ok'; recoveryCodes?: string[] }
  | { state: 'setup'; key: string; uri: string; wrong: boolean }
  | { state: 'required' }
  | { state: 'wrong' }
  | { state: 'too-many' }

const hashCode = (code: string) => crypto.createHash('sha256').update(code).digest('hex')
const newRecoveryCode = () => crypto.randomBytes(5).toString('hex').replace(/^(.{5})/, '$1-')

/** Takes a code: each one works once, however long its window lasts. */
async function spendCode(userId: string, secret: string | null, code: string): Promise<boolean> {
  const step = secret ? matchingStep(secret, code) : null
  if (step === null) return false
  const { rows } = await pool.query(
    'UPDATE admin_totp SET last_step = $2 WHERE user_id = $1 AND (last_step IS NULL OR last_step < $2) RETURNING user_id',
    [userId, step],
  )
  return rows.length > 0
}

async function spendRecoveryCode(userId: string, code: string): Promise<boolean> {
  const hash = hashCode(code)
  const { rows } = await pool.query(
    'UPDATE admin_totp SET recovery = array_remove(recovery, $2) WHERE user_id = $1 AND $2 = ANY(recovery) RETURNING user_id',
    [userId, hash],
  )
  return rows.length > 0
}

async function enrol(userId: string, username: string, stored: string | null, typed: string): Promise<SecondFactor> {
  let key = open(stored, PURPOSE)
  if (!key) {
    key = newTotpSecret()
    await pool.query(
      `INSERT INTO admin_totp (user_id, secret) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET secret = EXCLUDED.secret`,
      [userId, seal(key, PURPOSE)],
    )
  }
  const step = typed ? matchingStep(key, typed) : null
  if (step === null) return { state: 'setup', key, uri: totpUri(key, username), wrong: Boolean(typed) }

  const recoveryCodes = Array.from({ length: RECOVERY_CODES }, newRecoveryCode)
  await pool.query('UPDATE admin_totp SET confirmed_at = NOW(), last_step = $2, recovery = $3 WHERE user_id = $1', [
    userId,
    step,
    recoveryCodes.map(hashCode),
  ])
  return { state: 'ok', recoveryCodes }
}

/** Asked after the password is right, never before: the setup key is only for its owner. */
export async function checkSecondFactor(userId: string, username: string, code: unknown): Promise<SecondFactor> {
  const { rows } = await pool.query('SELECT secret, confirmed_at FROM admin_totp WHERE user_id = $1', [userId])
  const row = rows[0] as { secret: string; confirmed_at: string | null } | undefined
  const typed = typeof code === 'string' ? code.trim().replace(/\s/g, '') : ''
  if (row?.confirmed_at && !typed) return { state: 'required' }

  const attempt = typed ? await reserveAttempt('totp', `user:${userId}`) : null
  if (attempt && !attempt.allowed) {
    await attempt.release()
    return { state: 'too-many' }
  }

  if (!row?.confirmed_at) {
    const result = await enrol(userId, username, row?.secret ?? null, typed)
    if (result.state === 'ok') await attempt?.release()
    return result
  }

  const good = (await spendCode(userId, open(row.secret, PURPOSE), typed)) || (await spendRecoveryCode(userId, typed.toLowerCase()))
  if (!good) return { state: 'wrong' }
  await attempt?.release()
  return { state: 'ok' }
}
