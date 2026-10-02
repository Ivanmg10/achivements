jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/currentPassword', () => ({ checkCurrentPassword: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn(), loadUser: jest.fn() }))
jest.mock('@/lib/verificationEmail', () => ({ sendVerificationEmail: jest.fn() }))
jest.mock('@/lib/emailChangedNotice', () => ({ sendEmailChangedNotice: jest.fn() }))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { checkCurrentPassword } from '@/lib/currentPassword'
import { forgetUser, loadUser } from '@/lib/userRecord'
import { sendEmailChangedNotice } from '@/lib/emailChangedNotice'
import { sendVerificationEmail } from '@/lib/verificationEmail'

const request = (body: unknown) => ({ json: () => Promise.resolve(body) }) as unknown as Request

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', name: 'ivan' } })
  ;(checkCurrentPassword as jest.Mock).mockResolvedValue('ok')
  ;(loadUser as jest.Mock).mockResolvedValue({ id: 1, email: 'old@test.com' })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
})

const updates = () => (pool.query as jest.Mock).mock.calls.filter(([sql]) => String(sql).startsWith('UPDATE'))

describe('email, the recovery address', () => {
  test('changes with the current password, and drops the cached user', async () => {
    const res = await POST(request({ field: 'email', value: 'new@test.com', currentPassword: 'pass' }))
    expect(res.status).toBe(200)
    expect(checkCurrentPassword).toHaveBeenCalledWith('1', 'pass')
    expect(updates()[0][1]).toEqual(['new@test.com', '1'])
    expect(forgetUser).toHaveBeenCalledWith('1')
  })

  test('a new address is no longer verified, and gets its own link', async () => {
    await POST(request({ field: 'email', value: 'new@test.com', currentPassword: 'pass' }))
    expect(updates()[0][0]).toContain('email_verified_at = NULL')
    expect(sendVerificationEmail).toHaveBeenCalledWith('1', 'ivan', 'new@test.com')
  })

  test('the old address is told, so a change nobody asked for gets noticed', async () => {
    await POST(request({ field: 'email', value: 'new@test.com', currentPassword: 'pass' }))
    expect(sendEmailChangedNotice).toHaveBeenCalledWith({ to: 'old@test.com', username: 'ivan', newEmail: 'new@test.com', byAdmin: false })
  })

  test('no notice when the address only changes case, or there was none', async () => {
    await POST(request({ field: 'email', value: 'OLD@test.com', currentPassword: 'pass' }))
    ;(loadUser as jest.Mock).mockResolvedValue({ id: 1, email: null })
    await POST(request({ field: 'email', value: 'new@test.com', currentPassword: 'pass' }))
    expect(sendEmailChangedNotice).not.toHaveBeenCalled()
  })

  test('without the right password, a stolen session cannot redirect the recovery mail', async () => {
    ;(checkCurrentPassword as jest.Mock).mockResolvedValue('wrong')
    const res = await POST(request({ field: 'email', value: 'attacker@test.com' }))
    expect(res.status).toBe(403)
    expect((res as unknown as { data: unknown }).data).toEqual({ error: 'wrong-password' })
    expect(updates()).toHaveLength(0)
  })

  test('too many wrong guesses are refused', async () => {
    ;(checkCurrentPassword as jest.Mock).mockResolvedValue('too-many')
    expect((await POST(request({ field: 'email', value: 'a@test.com', currentPassword: 'x' }))).status).toBe(429)
  })

  test('an address another account has, in any case, is refused', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 2 }] })
    const res = await POST(request({ field: 'email', value: 'Taken@test.com', currentPassword: 'pass' }))
    expect(res.status).toBe(409)
    expect((pool.query as jest.Mock).mock.calls[0][0]).toContain('LOWER(email)')
  })
})

test('other fields do not ask for the password', async () => {
  const res = await POST(request({ field: 'location', value: 'es' }))
  expect(res.status).toBe(200)
  expect(checkCurrentPassword).not.toHaveBeenCalled()
  expect(updates()[0][0]).not.toContain('email_verified_at')
  expect(sendVerificationEmail).not.toHaveBeenCalled()
  expect(updates()[0][1]).toEqual(['ES', '1'])
})

test('an avatar must be https', async () => {
  expect((await POST(request({ field: 'avatar', value: 'http://x.test/a.png' }))).status).toBe(400)
  expect((await POST(request({ field: 'avatar', value: 'javascript:alert(1)' }))).status).toBe(400)
  expect((await POST(request({ field: 'avatar', value: 'https://x.test/a.png' }))).status).toBe(200)
})

test('a username taken in another case is refused', async () => {
  ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 2 }] })
  expect((await POST(request({ field: 'username', value: 'IVAN' }))).status).toBe(409)
})

test('fields outside the list cannot be written', async () => {
  expect((await POST(request({ field: 'admin', value: 'true' }))).status).toBe(400)
  expect((await POST(request({ field: 'password', value: 'x' }))).status).toBe(400)
  expect(updates()).toHaveLength(0)
})

test('401 without a session; a non-string value is refused', async () => {
  expect((await POST(request({ field: 'location', value: 42 }))).status).toBe(400)
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await POST(request({ field: 'location', value: 'ES' }))).status).toBe(401)
})

test('a name taken by someone else between the check and the write is a 409, not a 500', async () => {
  ;(pool.query as jest.Mock)
    .mockResolvedValueOnce({ rows: [] })
    .mockRejectedValueOnce(Object.assign(new Error('duplicate key'), { code: '23505' }))
  expect((await POST(request({ field: 'username', value: 'ivan2' }))).status).toBe(409)
})
