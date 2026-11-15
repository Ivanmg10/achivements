jest.mock('bcrypt', () => ({ compare: jest.fn() }))
jest.mock('@/lib/attemptLimit', () => ({ reserveAttempt: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ loadUser: jest.fn() }))

import bcrypt from 'bcrypt'
import { reserveAttempt } from '@/lib/attemptLimit'
import { loadUser } from '@/lib/userRecord'
import { checkCurrentPassword } from './currentPassword'

const release = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(reserveAttempt as jest.Mock).mockResolvedValue({ allowed: true, release })
  ;(loadUser as jest.Mock).mockResolvedValue({ id: 1, password: 'hash' })
  ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
})

test('the right password is ok, checked against a fresh read of the account, and does not count', async () => {
  await expect(checkCurrentPassword('1', 'pass')).resolves.toBe('ok')
  expect(loadUser).toHaveBeenCalledWith('1', { fresh: true })
  expect(bcrypt.compare).toHaveBeenCalledWith('pass', 'hash')
  expect(release).toHaveBeenCalled()
})

test('a wrong password stays counted against the account', async () => {
  ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
  await expect(checkCurrentPassword('1', 'nope')).resolves.toBe('wrong')
  expect(reserveAttempt).toHaveBeenCalledWith('password-check', 'user:1')
  expect(release).not.toHaveBeenCalled()
})

test('a missing or non-string password is wrong without asking bcrypt', async () => {
  await expect(checkCurrentPassword('1', undefined)).resolves.toBe('wrong')
  await expect(checkCurrentPassword('1', { a: 1 })).resolves.toBe('wrong')
  expect(bcrypt.compare).not.toHaveBeenCalled()
})

test('after too many wrong guesses it stops checking, and the refused try does not lengthen the wait', async () => {
  ;(reserveAttempt as jest.Mock).mockResolvedValue({ allowed: false, release })
  await expect(checkCurrentPassword('1', 'pass')).resolves.toBe('too-many')
  expect(bcrypt.compare).not.toHaveBeenCalled()
  expect(release).toHaveBeenCalled()
})

test('an account that is gone says so', async () => {
  ;(loadUser as jest.Mock).mockResolvedValue(null)
  await expect(checkCurrentPassword('1', 'pass')).resolves.toBe('no-user')
})
