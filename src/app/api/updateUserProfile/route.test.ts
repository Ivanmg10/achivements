jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/currentPassword', () => ({ checkCurrentPassword: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { checkCurrentPassword } from '@/lib/currentPassword'
import { forgetUser } from '@/lib/userRecord'

const request = (body: unknown) => ({ json: () => Promise.resolve(body) }) as unknown as Request

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  ;(checkCurrentPassword as jest.Mock).mockResolvedValue('ok')
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
