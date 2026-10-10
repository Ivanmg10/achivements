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

describe('GET', () => {
  test('lists the users', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1, username: 'ana' }] })
    const res = await GET(withBody('GET', {}))
    expect(res.status).toBe(200)
    expect((res as unknown as { data: unknown }).data).toEqual([{ id: 1, username: 'ana' }])
  })

  test('a database error is a 500, not a crash', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    expect((await GET(withBody('GET', {}))).status).toBe(500)
    ;(console.error as jest.Mock).mockRestore()
  })
})

describe('POST: what is refused, and why', () => {
  // The default mock answers every query with one existing row, which is "taken" for the uniqueness checks.
  const free = () => (pool.query as jest.Mock).mockImplementation((sql: string) =>
    Promise.resolve(sql.startsWith('INSERT') ? { rows: [{ id: 12, username: 'new' }] } : { rows: [] }))
  const post = (body: unknown) => POST(withBody('POST', body))

  test.each([
    ['no username', { password: 'secret12' }, 400],
    ['no password', { username: 'new' }, 400],
    ['a username with a space', { username: 'ne w', password: 'secret12' }, 400],
    ['a username that is too short', { username: 'ab', password: 'secret12' }, 400],
    ['a username that is too long', { username: 'a'.repeat(21), password: 'secret12' }, 400],
    ['a username with symbols', { username: 'new!', password: 'secret12' }, 400],
    ['a password that is not a string', { username: 'new', password: 12345678 }, 400],
    ['an email that is not an address', { username: 'new', password: 'secret12', email: 'nope' }, 400],
    ['an email that is not a string', { username: 'new', password: 'secret12', email: 7 }, 400],
  ])('%s', async (_name, body, status) => {
    free()
    expect((await post(body)).status).toBe(status)
    expect(pool.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT'), expect.anything())
  })

  test('a body that is not JSON is a 400, not a crash', async () => {
    const req = new NextRequest('http://localhost/api/admin/users', { method: 'POST', body: 'not json' }) as unknown as Request
    expect((await POST(req)).status).toBe(400)
  })

  test('a username that is already taken, in any case, is a 409', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] })
    expect((await post({ username: 'NEW', password: 'secret12' })).status).toBe(409)
  })

  test('two sign-ups racing past the check still end in a 409, from the database constraint', async () => {
    ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
      sql.startsWith('INSERT') ? Promise.reject(Object.assign(new Error('dup'), { code: '23505' })) : Promise.resolve({ rows: [] }))
    expect((await post({ username: 'new', password: 'secret12' })).status).toBe(409)
  })

  test('an unexpected database error is a 500', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    expect((await post({ username: 'new', password: 'secret12' })).status).toBe(500)
    ;(console.error as jest.Mock).mockRestore()
  })

  test('an admin can be created, and is logged as one', async () => {
    free()
    expect((await post({ username: 'new', password: 'secret12', admin: true })).status).toBe(201)
    expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'create-user', expect.anything(), { email: null, admin: true })
    expect(sendVerificationEmail).not.toHaveBeenCalled()
  })
})

describe('PATCH: what is refused, and why', () => {
  const patch = (body: unknown) => PATCH(withBody('PATCH', body))
  // Nothing else has this username or address, and user 11 exists.
  const alone = () => (pool.query as jest.Mock).mockImplementation((sql: string) =>
    Promise.resolve(sql.startsWith('SELECT id, username, email') ? { rows: [{ id: 11, username: 'bob', email: null, previous: null }] } : { rows: [] }))

  test.each([
    ['no id', { field: 'theme', value: 'dark' }],
    ['no field', { id: 11, value: 'dark' }],
    ['a username with symbols', { id: 11, field: 'username', value: 'bob!' }],
    ['a username that is too short', { id: 11, field: 'username', value: 'bo' }],
    ['an email that is not an address', { id: 11, field: 'email', value: 'nope' }],
    ['an avatar that is plain http', { id: 11, field: 'avatar', value: 'http://x.test/a.png' }],
    ['an avatar that is not a URL', { id: 11, field: 'avatar', value: 'javascript:alert(1)' }],
    ['a location that is not a country code', { id: 11, field: 'location', value: 'Spain' }],
    ['a theme that does not exist', { id: 11, field: 'theme', value: 'neon' }],
    ['admin that is not a boolean', { id: 11, field: 'admin', value: 'true' }],
  ])('%s is a 400 and nothing is written', async (_name, body) => {
    alone()
    expect((await patch(body)).status).toBe(400)
    expect(pool.query).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE'), expect.anything())
  })

  test('an admin cannot take their own admin away', async () => {
    alone()
    const res = await patch({ id: 3, field: 'admin', value: false })
    expect(res.status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('but can take another admin away', async () => {
    alone()
    expect((await patch({ id: 11, field: 'admin', value: false })).status).toBe(200)
  })

  test('a field name with SQL in it never reaches the query', async () => {
    alone()
    expect((await patch({ id: 11, field: 'admin" = true --', value: true })).status).toBe(400)
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('a username another account has is a 409', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 99 }] })
    expect((await patch({ id: 11, field: 'username', value: 'taken' })).status).toBe(409)
  })

  test('an email another account has is a 409', async () => {
    ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 99 }] })
    expect((await patch({ id: 11, field: 'email', value: 'taken@test.com' })).status).toBe(409)
  })

  test('the address, the avatar and the country can be cleared with null', async () => {
    alone()
    for (const field of ['email', 'avatar', 'location']) {
      expect((await patch({ id: 11, field, value: null })).status).toBe(200)
    }
  })

  test('a country code in lower case is accepted', async () => {
    alone()
    expect((await patch({ id: 11, field: 'location', value: 'es' })).status).toBe(200)
  })

  test('a unique violation from the database is a 409', async () => {
    ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
      sql.startsWith('UPDATE') ? Promise.reject(Object.assign(new Error('dup'), { code: '23505' }))
        : Promise.resolve(sql.startsWith('SELECT id, username, email') ? { rows: [{ id: 11, username: 'bob', email: null }] } : { rows: [] }))
    expect((await patch({ id: 11, field: 'theme', value: 'dark' })).status).toBe(409)
  })

  test('an unexpected database error is a 500', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    expect((await patch({ id: 11, field: 'theme', value: 'dark' })).status).toBe(500)
    ;(console.error as jest.Mock).mockRestore()
  })

  test('the same address in another case is not a change, so nobody is told about one', async () => {
    ;(pool.query as jest.Mock).mockImplementation((sql: string) =>
      Promise.resolve(sql.startsWith('SELECT id, username, email') ? { rows: [{ id: 11, username: 'bob', email: 'Bob@Test.com', previous: 'Bob@Test.com' }] } : { rows: [] }))
    await patch({ id: 11, field: 'email', value: 'bob@test.com' })
    expect(sendEmailChangedNotice).not.toHaveBeenCalled()
  })
})
