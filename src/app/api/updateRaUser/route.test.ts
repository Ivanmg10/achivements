jest.mock('@/lib/db', () => {
  const query = jest.fn()
  return { __esModule: true, default: { query } }
})

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import pool from '@/lib/db'

const validRaUser = {
  ID: 1,
  User: 'ivan',
  ULID: 'ulid',
  UserPic: '/pic.png',
  TotalPoints: 100,
}

beforeEach(() => {
  ;(pool.query as jest.Mock).mockResolvedValue({})
})

function makeRequest(body: object) {
  return { json: () => Promise.resolve(body) } as unknown as Request
}

test('POST returns 401 when no session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const res = await POST(makeRequest({ raUser: validRaUser }))
  expect(res.status).toBe(401)
})

test('POST returns 400 when raUser missing required fields', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1 } })
  const res = await POST(makeRequest({ raUser: { User: 'ivan' }, apiKey: 'key123' }))
  expect(res.status).toBe(400)
})

test('POST returns 400 when apiKey is missing', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1 } })
  const res = await POST(makeRequest({ raUser: validRaUser }))
  expect(res.status).toBe(400)
})

test('POST returns 400 when apiKey is empty string', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1 } })
  const res = await POST(makeRequest({ raUser: validRaUser, apiKey: '   ' }))
  expect(res.status).toBe(400)
})

test('POST updates RA user with apiKey as raid', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1 } })
  const res = await POST(makeRequest({ raUser: validRaUser, apiKey: 'my-actual-api-key' }))
  expect(res.status).toBe(200)
  expect(pool.query as jest.Mock).toHaveBeenCalledWith(
    expect.stringContaining('raid'),
    expect.arrayContaining(['my-actual-api-key', 'ivan']),
  )
})

test('POST does not use ULID as raid', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1 } })
  const res = await POST(makeRequest({ raUser: validRaUser, apiKey: 'my-actual-api-key' }))
  expect(res.status).toBe(200)
  const callArgs = (pool.query as jest.Mock).mock.calls[0][1] as unknown[]
  expect(callArgs).not.toContain('ulid')
})

test('POST returns 400 when raUser is not an object', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1 } })
  const res = await POST(makeRequest({ raUser: 'notanobject', apiKey: 'key' }))
  expect(res.status).toBe(400)
})
