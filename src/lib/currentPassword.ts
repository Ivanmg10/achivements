import bcrypt from 'bcrypt'
import { reserveAttempt } from '@/lib/attemptLimit'
import { loadUser } from '@/lib/userRecord'

export type PasswordCheck = 'ok' | 'wrong' | 'too-many' | 'no-user'

/**
 * Confirms the signed-in user typed their current password, before a change
 * that would let a stolen session keep the account (a new password, a new
 * recovery email). Wrong guesses are counted per account.
 */
export async function checkCurrentPassword(userId: string, password: unknown): Promise<PasswordCheck> {
  const attempt = await reserveAttempt('password-check', `user:${userId}`)
  if (!attempt.allowed) {
    await attempt.release()
    return 'too-many'
  }

  const row = await loadUser(userId, { fresh: true })
  if (!row) {
    await attempt.release()
    return 'no-user'
  }

  if (typeof password !== 'string' || !password || !(await bcrypt.compare(password, row.password))) return 'wrong'
  await attempt.release()
  return 'ok'
}
