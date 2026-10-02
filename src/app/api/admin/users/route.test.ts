jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))
jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn(), logAdminAction: jest.fn() }))
jest.mock('@/lib/verificationEmail', () => ({ sendVerificationEmail: jest.fn() }))
jest.mock('@/lib/emailChangedNotice', () => ({ sendEmailChangedNotice: jest.fn() }))
jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }))

import { DELETE, GET, PATCH, POST } from './route'
import pool from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { forgetUser } from '@/lib/userRecord'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { sendVerificationEmail } from '@/lib/verificationEmail'
import { sendEmailChangedNotice } from '@/lib/emailChangedNotice'
import bcrypt from 'bcrypt'

function del(id?: string) {
  const url = new URL('http://localhost/api/admin/users')
  if (id !== undefined) url.searchParams.set('id', id)
  return new NextRequest(url.toString(), { method: 'DELETE' })
}

const withBody = (method: string, body: unknown) =>
  new NextRequest('http://localhost/api/admin/users', { method, body: JSON.stringify(body) }) as unknown as Request

const ADMIN = { id: '3', username: 'boss', pwv: 'v1' }

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: ADMIN })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 11 }] })
})

describe('who may use it', () => {
  test('without an admin who unlocked the panel, every handler answers what adminAuth says and touches nothing', async () => {
    const locked = NextResponse.json({ error: 'reauth-required' }, { status: 403 })
    ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: locked })

    expect(await GET(withBody('GET', {}))).toBe(locked)
    expect(await POST(withBody('POST', { username: 'new', password: 'secret12' }))).toBe(locked)
    expect(await PATCH(withBody('PATCH', { id: 11, field: 'location', value: 'ES' }))).toBe(locked)
    expect(await DELETE(del('11'))).toBe(locked)
    expect(pool.query).not.toHaveBeenCalled()
  })
})

describe('the action log', () => {
  test('a deletion is logged with the deleted name', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 11, username: 'bob' }] })
    await DELETE(del('11'))
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'delete-user', { id: 11, username: 'bob' })
  })

  test('an edit is logged with what it was and what it became', async () => {
    ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
      Promise.resolve(sql.startsWith('SELECT id, username, email') ? { rows: [{ id: 11, username: 'bob', email: null, previous: 'FR' }] } : { rows: [] }),
    )
    await PATCH(withBody('PATCH', { id: 11, field: 'location', value: 'ES' }))
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'update-user', expect.objectContaining({ id: 11 }), { field: 'location', from: 'FR', to: 'ES' })
  })

  test('a creation is logged, and the new address gets its verification link', async () => {
    ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
      Promise.resolve(sql.startsWith('INSERT') ? { rows: [{ id: 12, username: 'new' }] } : { rows: [] }),
    )
    expect((await POST(withBody('POST', { username: 'new', email: 'n@test.com', password: 'secret12' }))).status).toBe(201)
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'create-user', { id: 12, username: 'new' }, { email: 'n@test.com', admin: false })
    expect(sendVerificationEmail).toHaveBeenCalledWith(12, 'new', 'n@test.com')
  })
})

describe("changing a user's email", () => {
  const current = (email: string | null) =>
    (pool.query as jest.Mock).mockImplementation((sql: string) =>
      Promise.resolve(sql.startsWith('SELECT id, username, email') ? { rows: [{ id: 11, username: 'bob', email, previous: email }] } : { rows: [] }),
    )

  test('the old address is told an administrator changed it', async () => {
    current('old@test.com')
    expect((await PATCH(withBody('PATCH', { id: 11, field: 'email', value: 'new@test.com' }))).status).toBe(200)
    expect(sendEmailChangedNotice).toHaveBeenCalledWith({ to: 'old@test.com', username: 'bob', newEmail: 'new@test.com', byAdmin: true })
  })

  test('no notice when there was no address before', async () => {
    current(null)
    await PATCH(withBody('PATCH', { id: 11, field: 'email', value: 'new@test.com' }))
    expect(sendEmailChangedNotice).not.toHaveBeenCalled()
  })

  test('404 for a user that does not exist, before anything is written', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
    expect((await PATCH(withBody('PATCH', { id: 99, field: 'location', value: 'ES' }))).status).toBe(404)
    expect((pool.query as jest.Mock).mock.calls.some(([sql]) => String(sql).startsWith('UPDATE'))).toBe(false)
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
    ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
      Promise.resolve(sql.startsWith('SELECT id, username, email') ? { rows: [{ id: 11, username: 'bob', email: null }] } : { rows: [] }),
    )
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
