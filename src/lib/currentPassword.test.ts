jest.mock('bcrypt', () => ({ compare: jest.fn() }))
jest.mock('@/lib/attemptLimit', () => ({ isLimited: jest.fn(), recordAttempt: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ loadUser: jest.fn() }))

import bcrypt from 'bcrypt'
import { isLimited, recordAttempt } from '@/lib/attemptLimit'
import { loadUser } from '@/lib/userRecord'
import { checkCurrentPassword } from './currentPassword'

beforeEach(() => {
  jest.clearAllMocks()
  ;(isLimited as jest.Mock).mockResolvedValue(false)
  ;(loadUser as jest.Mock).mockResolvedValue({ id: 1, password: 'hash' })
  ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
})

test('the right password is ok, checked against a fresh read of the account', async () => {
  await expect(checkCurrentPassword('1', 'pass')).resolves.toBe('ok')
  expect(loadUser).toHaveBeenCalledWith('1', { fresh: true })
  expect(bcrypt.compare).toHaveBeenCalledWith('pass', 'hash')
  expect(recordAttempt).not.toHaveBeenCalled()
})

test('a wrong password is counted against the account', async () => {
  ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
  await expect(checkCurrentPassword('1', 'nope')).resolves.toBe('wrong')
  expect(recordAttempt).toHaveBeenCalledWith('password-check', 'user:1')
})

test('a missing or non-string password is wrong without asking bcrypt', async () => {
  await expect(checkCurrentPassword('1', undefined)).resolves.toBe('wrong')
  await expect(checkCurrentPassword('1', { a: 1 })).resolves.toBe('wrong')
  expect(bcrypt.compare).not.toHaveBeenCalled()
})

test('after too many wrong guesses it stops checking', async () => {
  ;(isLimited as jest.Mock).mockResolvedValue(true)
  await expect(checkCurrentPassword('1', 'pass')).resolves.toBe('too-many')
  expect(bcrypt.compare).not.toHaveBeenCalled()
})

test('an account that is gone says so', async () => {
  ;(loadUser as jest.Mock).mockResolvedValue(null)
  await expect(checkCurrentPassword('1', 'pass')).resolves.toBe('no-user')
})
