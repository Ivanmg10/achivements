jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn() }))

import { GET } from './route'
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'

const request = {} as Request

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { id: '3', username: 'boss', pwv: 'v1' } })
})

test('the latest actions, newest first, at most 100', async () => {
  ;(pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 2 }, { id: 1 }] })
  const res = await GET(request)
  expect((res as unknown as { data: unknown }).data).toEqual([{ id: 2 }, { id: 1 }])
  const [sql, params] = (pool.query as jest.Mock).mock.calls[0]
  expect(sql).toContain('ORDER BY created_at DESC')
  expect(params).toEqual([100])
})

test('a locked panel gets the auth answer', async () => {
  const locked = NextResponse.json({ error: 'reauth-required' }, { status: 403 })
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: locked })
  expect(await GET(request)).toBe(locked)
  expect(pool.query).not.toHaveBeenCalled()
})

test('500 when the database fails', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(pool.query as jest.Mock).mockRejectedValue(new Error('db down'))
  expect((await GET(request)).status).toBe(500)
})
