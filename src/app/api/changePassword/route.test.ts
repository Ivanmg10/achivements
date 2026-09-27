jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('new-hash') }))
jest.mock('@/lib/currentPassword', () => ({ checkCurrentPassword: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import bcrypt from 'bcrypt'
import { checkCurrentPassword } from '@/lib/currentPassword'
import { forgetUser } from '@/lib/userRecord'

const request = (body: unknown) => ({ json: () => Promise.resolve(body) }) as unknown as Request
const valid = { currentPassword: 'old-pass', newPassword: 'new-pass1' }

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  ;(checkCurrentPassword as jest.Mock).mockResolvedValue('ok')
  ;(pool.query as jest.Mock).mockResolvedValue({})
})

test('changes the password with a strong hash and drops the cached user, which ends every session', async () => {
  const res = await POST(request(valid))
  expect(res.status).toBe(200)
  expect(checkCurrentPassword).toHaveBeenCalledWith('1', 'old-pass')
  expect(bcrypt.hash).toHaveBeenCalledWith('new-pass1', 12)
  expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET password'), ['new-hash', '1'])
  expect(forgetUser).toHaveBeenCalledWith('1')
})

test('401 without a session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await POST(request(valid))).status).toBe(401)
})

test('both passwords are required', async () => {
  expect((await POST(request({ newPassword: 'new-pass1' }))).status).toBe(400)
  expect((await POST(request({ currentPassword: 'x' }))).status).toBe(400)
})

test('a new password under eight characters is refused before anything is checked', async () => {
  const res = await POST(request({ currentPassword: 'old', newPassword: '1234567' }))
  expect(res.status).toBe(400)
  expect((res as unknown as { data: unknown }).data).toEqual({ error: 'weak-password' })
  expect(checkCurrentPassword).not.toHaveBeenCalled()
})

test.each([
  ['wrong', 403, 'wrong-password'],
  ['too-many', 429, 'too-many-attempts'],
  ['no-user', 401, 'Unauthorized'],
])('a %s current password check changes nothing', async (check, status, error) => {
  ;(checkCurrentPassword as jest.Mock).mockResolvedValue(check)
  const res = await POST(request(valid))
  expect(res.status).toBe(status)
  expect((res as unknown as { data: unknown }).data).toEqual({ error })
  expect(pool.query).not.toHaveBeenCalled()
})

test('a database error is a 500', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await POST(request(valid))).status).toBe(500)
})
