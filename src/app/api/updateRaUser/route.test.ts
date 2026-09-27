jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/raClient', () => ({ getUserProfile: jest.fn() }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))

import { POST, PUT } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'
import { getUserProfile } from '@/lib/raClient'
import { forgetUser } from '@/lib/userRecord'

const profile = { ID: 1, User: 'Ivan', ULID: 'ulid', UserPic: '/pic.png', TotalPoints: 100 }

function makeRequest(body: unknown) {
  return { json: () => Promise.resolve(body) } as unknown as Request
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1', rausername: 'Ivan', raid: 'stored-key' } })
  ;(getUserProfile as jest.Mock).mockResolvedValue(profile)
  ;(pool.query as jest.Mock).mockResolvedValue({})
})

describe('POST (link)', () => {
  test('401 without a session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect((await POST(makeRequest({ username: 'ivan', apiKey: 'k' }))).status).toBe(401)
  })

  test('stores what RA answered, not anything the browser sent about the account', async () => {
    const res = await POST(makeRequest({ username: 'ivan', apiKey: ' my-key ', raUser: { User: 'Admin', TotalPoints: 999999 } }))
    expect(res.status).toBe(200)
    expect(getUserProfile).toHaveBeenCalledWith('ivan', 'my-key')
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain('UPDATE users SET "raUser" = $1, rausername = $2, raid = $3')
    expect(JSON.parse(params[0])).toEqual(profile)
    expect(params.slice(1)).toEqual(['Ivan', 'my-key', '1'])
    expect(forgetUser).toHaveBeenCalledWith('1')
  })

  test('a username and key are both required', async () => {
    expect((await POST(makeRequest({ username: 'ivan' }))).status).toBe(400)
    expect((await POST(makeRequest({ apiKey: 'k' }))).status).toBe(400)
    expect((await POST(makeRequest({ username: '  ', apiKey: 'k' }))).status).toBe(400)
    expect((await POST(makeRequest({ username: ['ivan'], apiKey: 'k' }))).status).toBe(400)
    expect((await POST(makeRequest(null))).status).toBe(400)
    expect(getUserProfile).not.toHaveBeenCalled()
  })

  test('absurdly long input is refused before RA is asked', async () => {
    expect((await POST(makeRequest({ username: 'x'.repeat(200), apiKey: 'k' }))).status).toBe(400)
    expect(getUserProfile).not.toHaveBeenCalled()
  })

  test('a key or username RA rejects is a 400 the modal can explain', async () => {
    ;(getUserProfile as jest.Mock).mockRejectedValue(Object.assign(new Error('RA API error 401'), { status: 401 }))
    const res = await POST(makeRequest({ username: 'ivan', apiKey: 'bad' }))
    expect(res.status).toBe(400)
    expect((res as unknown as { data: unknown }).data).toEqual({ error: 'ra-invalid' })
    expect(pool.query).not.toHaveBeenCalled()
  })

  test('RA answering with no user is also ra-invalid', async () => {
    ;(getUserProfile as jest.Mock).mockResolvedValue({ User: '' })
    expect((await POST(makeRequest({ username: 'ivan', apiKey: 'k' }))).status).toBe(400)
  })

  test('RA being down is a 502, not a pretend success', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(getUserProfile as jest.Mock).mockRejectedValue(new Error('timeout'))
    expect((await POST(makeRequest({ username: 'ivan', apiKey: 'k' }))).status).toBe(502)
  })

  test('a key already linked to another account here is a 409', async () => {
    ;(pool.query as jest.Mock).mockRejectedValue(Object.assign(new Error('duplicate'), { code: '23505' }))
    const res = await POST(makeRequest({ username: 'ivan', apiKey: 'k' }))
    expect(res.status).toBe(409)
    expect((res as unknown as { data: unknown }).data).toEqual({ error: 'key-in-use' })
  })

  test('any other database error is a 500', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
    expect((await POST(makeRequest({ username: 'ivan', apiKey: 'k' }))).status).toBe(500)
  })
})

describe('PUT (refresh)', () => {
  test('re-fetches with the stored username and key, and stores only the profile', async () => {
    const res = await PUT()
    expect(res.status).toBe(200)
    expect(getUserProfile).toHaveBeenCalledWith('Ivan', 'stored-key')
    const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
    expect(sql).toContain('UPDATE users SET "raUser" = $1 WHERE id = $2')
    expect(params[1]).toBe('1')
    expect(forgetUser).toHaveBeenCalledWith('1')
  })

  test('401 without a session, 400 without an RA link', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect((await PUT()).status).toBe(401)
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
    expect((await PUT()).status).toBe(400)
  })

  test('RA being down is a 502', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(getUserProfile as jest.Mock).mockRejectedValue(new Error('timeout'))
    expect((await PUT()).status).toBe(502)
  })
})
