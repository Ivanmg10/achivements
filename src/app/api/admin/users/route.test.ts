jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/userRecord', () => ({ loadUser: jest.fn(), forgetUser: jest.fn() }))
jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }))

import { DELETE, PATCH, POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { NextRequest } from 'next/server'
import { forgetUser, loadUser } from '@/lib/userRecord'
import bcrypt from 'bcrypt'

function del(id?: string) {
  const url = new URL('http://localhost/api/admin/users')
  if (id !== undefined) url.searchParams.set('id', id)
  return new NextRequest(url.toString(), { method: 'DELETE' })
}

const withBody = (method: string, body: unknown) =>
  new NextRequest('http://localhost/api/admin/users', { method, body: JSON.stringify(body) }) as unknown as Request

/** The admin flag as the database has it right now. */
function isAdmin(admin: boolean) {
  ;(loadUser as jest.Mock).mockResolvedValue({ id: 3, admin })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '3', admin: true } })
  isAdmin(true)
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 11 }] })
})

describe('who may use it', () => {
  test('the admin flag is read fresh from the database, not from the session', async () => {
    await DELETE(del('11'))
    expect(loadUser).toHaveBeenCalledWith('3', { fresh: true })
  })

  test('a session that still says admin, for someone just demoted, is refused', async () => {
    isAdmin(false)
    expect((await DELETE(del('11'))).status).toBe(403)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('no session is refused', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect((await DELETE(del('11'))).status).toBe(403)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('an account that no longer exists is refused', async () => {
    ;(loadUser as jest.Mock).mockResolvedValue(null)
    expect((await DELETE(del('11'))).status).toBe(403)
  })
})

describe('DELETE', () => {
  test('an admin deletes a user; everything they own goes with them', async () => {
    const res = await DELETE(del('11'))
    expect(res.status).toBe(200)
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM users'), ['11'])
    expect(forgetUser).toHaveBeenCalledWith('11')
  })

  test('an admin cannot delete their own account', async () => {
    expect((await DELETE(del('3'))).status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('rejects a missing or non-numeric id', async () => {
    expect((await DELETE(del())).status).toBe(400)
    expect((await DELETE(del('abc'))).status).toBe(400)
  })

  test('a user who is already gone is a 404', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
    expect((await DELETE(del('11'))).status).toBe(404)
  })

  test('a database error is a 500, not a crash', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    expect((await DELETE(del('11'))).status).toBe(500)
  })
})

describe('POST', () => {
  test('creates a user with a strong hash', async () => {
    ;(pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 12, username: 'new' }] })
    const res = await POST(withBody('POST', { username: 'new', email: 'n@test.com', password: 'secret12' }))
    expect(res.status).toBe(201)
    expect(bcrypt.hash).toHaveBeenCalledWith('secret12', 12)
  })

  test('a password under eight characters is refused', async () => {
    expect((await POST(withBody('POST', { username: 'new', password: '1234567' }))).status).toBe(400)
  })

  test('an email another account has is refused', async () => {
    ;(pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ id: 5 }] })
    expect((await POST(withBody('POST', { username: 'new', email: 'Taken@test.com', password: 'secret12' }))).status).toBe(409)
  })
})

describe('PATCH', () => {
  test('an avatar must be https', async () => {
    expect((await PATCH(withBody('PATCH', { id: 11, field: 'avatar', value: 'http://x.test/a.png' }))).status).toBe(400)
    expect((await PATCH(withBody('PATCH', { id: 11, field: 'avatar', value: 'https://x.test/a.png' }))).status).toBe(200)
  })

  test('a change drops the edited user from the session cache, so it shows at once', async () => {
    await PATCH(withBody('PATCH', { id: 11, field: 'admin', value: false }))
    expect(forgetUser).toHaveBeenCalledWith(11)
  })

  test('a new email is no longer verified', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
    expect((await PATCH(withBody('PATCH', { id: 11, field: 'email', value: 'new@test.com' }))).status).toBe(200)
    const update = (pool.query as jest.Mock).mock.calls.find(([sql]) => String(sql).startsWith('UPDATE'))
    expect(update[0]).toContain('email_verified_at = NULL')
  })

  test('other fields leave the verification alone', async () => {
    await PATCH(withBody('PATCH', { id: 11, field: 'location', value: 'ES' }))
    const update = (pool.query as jest.Mock).mock.calls.find(([sql]) => String(sql).startsWith('UPDATE'))
    expect(update[0]).not.toContain('email_verified_at')
  })

  test('a non-numeric id is refused', async () => {
    expect((await PATCH(withBody('PATCH', { id: 'abc', field: 'location', value: 'ES' }))).status).toBe(400)
  })

  test('only listed fields can be written', async () => {
    expect((await PATCH(withBody('PATCH', { id: 11, field: 'password', value: 'x' }))).status).toBe(400)
  })
})
