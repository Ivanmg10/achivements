jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/currentPassword', () => ({ checkCurrentPassword: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn(), loadUser: jest.fn() }))

import { DELETE } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { checkCurrentPassword } from '@/lib/currentPassword'
import { forgetUser, loadUser } from '@/lib/userRecord'

const request = (body: unknown) => ({ json: () => Promise.resolve(body) }) as unknown as Request
const deletes = () => (pool.query as jest.Mock).mock.calls.filter(([sql]) => String(sql).startsWith('DELETE'))

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7' } })
  ;(checkCurrentPassword as jest.Mock).mockResolvedValue('ok')
  ;(loadUser as jest.Mock).mockResolvedValue({ id: 7, admin: false })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
})

test('with the right password, the account goes, and the cached row with it', async () => {
  const res = await DELETE(request({ currentPassword: 'secret12' }))
  expect(res.status).toBe(200)
  expect(checkCurrentPassword).toHaveBeenCalledWith('7', 'secret12')
  expect(deletes()).toEqual([['DELETE FROM users WHERE id = $1', ['7']]])
  expect(forgetUser).toHaveBeenCalledWith('7')
})

test('a stolen session without the password cannot delete anything', async () => {
  ;(checkCurrentPassword as jest.Mock).mockResolvedValue('wrong')
  const res = await DELETE(request({ currentPassword: 'guess' }))
  expect(res.status).toBe(403)
  expect((res as unknown as { data: unknown }).data).toEqual({ error: 'wrong-password' })
  expect(deletes()).toHaveLength(0)
})

test('too many wrong guesses are refused', async () => {
  ;(checkCurrentPassword as jest.Mock).mockResolvedValue('too-many')
  expect((await DELETE(request({ currentPassword: 'x' }))).status).toBe(429)
  expect(deletes()).toHaveLength(0)
})

test('the last admin cannot leave the site without one', async () => {
  ;(loadUser as jest.Mock).mockResolvedValue({ id: 7, admin: true })
  ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ n: 0 }] })
  const res = await DELETE(request({ currentPassword: 'secret12' }))
  expect(res.status).toBe(409)
  expect((res as unknown as { data: unknown }).data).toEqual({ error: 'last-admin' })
  expect(deletes()).toHaveLength(0)
})

test('an admin can go when there is another one', async () => {
  ;(loadUser as jest.Mock).mockResolvedValue({ id: 7, admin: true })
  ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ n: 1 }] })
  expect((await DELETE(request({ currentPassword: 'secret12' }))).status).toBe(200)
  expect(deletes()).toHaveLength(1)
})

test('401 without a session, or when the account is already gone', async () => {
  ;(checkCurrentPassword as jest.Mock).mockResolvedValue('no-user')
  expect((await DELETE(request({ currentPassword: 'x' }))).status).toBe(401)
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  expect((await DELETE(request({ currentPassword: 'x' }))).status).toBe(401)
  expect(deletes()).toHaveLength(0)
})

test('500 when the database fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await DELETE(request({ currentPassword: 'secret12' }))).status).toBe(500)
})
