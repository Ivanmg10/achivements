import { GET, POST } from './route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { clearCache } from '@/lib/raCache'

jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/fetchRA', () => ({ fetchRA: jest.fn() }))

import { fetchRA } from '@/lib/fetchRA'

global.fetch = jest.fn()

const mockSession = {
  user: { id: '1', rausername: 'user', raid: 'key' },
}

beforeEach(() => {
  clearCache()
  ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  ;(fetchRA as jest.Mock).mockResolvedValue({ User: 'IvanXMarine', TotalPoints: 272 })
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ User: 'IvanXMarine', TotalPoints: 272 }),
  })
})

test('GET returns user profile', async () => {
  const res = await GET()
  expect(res.status).toBe(200)
  expect((res as any).data).toHaveProperty('User', 'IvanXMarine')
})

test('GET returns 401 when no session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const res = await GET()
  expect(res.status).toBe(401)
})

test('GET returns 400 when no RA account', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '1' } })
  const res = await GET()
  expect(res.status).toBe(400)
})

test('GET returns 503 when fetchRA throws', async () => {
  ;(fetchRA as jest.Mock).mockRejectedValueOnce(new Error('RA API error 500'))
  const res = await GET()
  expect(res.status).toBe(503)
})

test('GET returns 503 when RA returns empty User', async () => {
  ;(fetchRA as jest.Mock).mockResolvedValueOnce({ User: null })
  const res = await GET()
  expect(res.status).toBe(503)
})

test('POST returns user profile with provided credentials', async () => {
  const req = new NextRequest('http://localhost/api/getUserProfile', {
    method: 'POST',
    body: JSON.stringify({ username: 'user', apiKey: 'key' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(200)
  expect((res as any).data).toHaveProperty('User', 'IvanXMarine')
})

test('POST returns 401 when no session', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValue(null)
  const req = new NextRequest('http://localhost/api/getUserProfile', {
    method: 'POST',
    body: JSON.stringify({ username: 'user', apiKey: 'key' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(401)
})

test('POST returns 400 when missing username or apiKey', async () => {
  const req = new NextRequest('http://localhost/api/getUserProfile', {
    method: 'POST',
    body: JSON.stringify({ username: 'user' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(400)
})
