jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/apiAuth', () => ({ requireSession: jest.fn() }))
jest.mock('@/lib/psnClient', () => ({
  psnSummary: jest.fn(),
  psnFailure: jest.fn(() => jest.requireActual('next/server').NextResponse.json({ error: 'private' }, { status: 403 })),
}))

import { GET } from './route'
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireSession } from '@/lib/apiAuth'
import { psnSummary } from '@/lib/psnClient'

const get = (query = 'u=Bob') => new NextRequest(`http://localhost/api/public/user/psn?${query}`) as NextRequest

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: true, id: '1' })
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 7, psnaccountid: '123' }] })
  ;(psnSummary as jest.Mock).mockResolvedValue({ onlineId: 'BobPS' })
})

test('signed-out visitors get the auth answer and nothing is read', async () => {
  const denied = NextResponse.json({ message: 'No autorizado' }, { status: 401 })
  ;(requireSession as jest.Mock).mockResolvedValue({ ok: false, response: denied })
  expect(await GET(get())).toBe(denied)
  expect(pool.query).not.toHaveBeenCalled()
})

test('a missing name is a 400', async () => {
  expect((await GET(get(''))).status).toBe(400)
})

test('returns the summary of the PSN account linked by that RA user, case-insensitively', async () => {
  const res = await GET(get())
  expect(res.status).toBe(200)
  expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual(['Bob'])
  expect(psnSummary).toHaveBeenCalledWith('123', '7')
})

test('a user with no PSN linked is a 404', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [] })
  expect((await GET(get())).status).toBe(404)
  expect(psnSummary).not.toHaveBeenCalled()
})

test('a failing lookup is a 500', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await GET(get())).status).toBe(500)
})

test('Sony errors go through psnFailure', async () => {
  ;(psnSummary as jest.Mock).mockRejectedValue(new Error('private'))
  expect((await GET(get())).status).toBe(403)
})
