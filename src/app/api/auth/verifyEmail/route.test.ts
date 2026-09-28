jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/userRecord', () => ({ forgetUser: jest.fn() }))

import { GET } from './route'
import { NextRequest } from 'next/server'
import pool from '@/lib/db'
import { forgetUser } from '@/lib/userRecord'
import { signVerification } from '@/lib/emailVerification'

const query = pool.query as jest.Mock

function request(token: string) {
  return new NextRequest(`https://www.cheevovault.com/api/auth/verifyEmail?token=${encodeURIComponent(token)}`)
}

/** The update, then the read-back the route does to tell "already done" from "wrong". */
function answers({ updated, exists }: { updated: number; exists: boolean }) {
  query
    .mockResolvedValueOnce({ rowCount: updated })
    .mockResolvedValueOnce({ rows: exists ? [{ email_verified_at: '2026-09-28' }] : [] })
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = 'https://www.cheevovault.com'
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('a good link marks the address confirmed and says so', async () => {
  answers({ updated: 1, exists: true })
  const res = await GET(request(signVerification(7, 'ivan@test.com')))

  expect(res.status).toBe(307)
  expect(res.headers.get('location')).toBe('https://www.cheevovault.com/user?email=verified')
  expect(query.mock.calls[0][1]).toEqual(['7', 'ivan@test.com'])
  expect(forgetUser).toHaveBeenCalledWith('7')
})

test('following the same link twice is not an error', async () => {
  answers({ updated: 0, exists: true })
  const res = await GET(request(signVerification(7, 'ivan@test.com')))

  expect(res.headers.get('location')).toContain('email=verified')
  // Nothing changed, so no cached session needs dropping.
  expect(forgetUser).not.toHaveBeenCalled()
})

test('a link for an address the account no longer has does nothing', async () => {
  answers({ updated: 0, exists: false })
  const res = await GET(request(signVerification(7, 'old@test.com')))

  expect(res.headers.get('location')).toContain('email=mismatch')
})

test('a forged or stale token is turned away without touching the database', async () => {
  const res = await GET(request('not-a-real-token'))

  expect(res.headers.get('location')).toContain('email=expired')
  expect(query).not.toHaveBeenCalled()
})

test('a database failure reports expired rather than a stack trace', async () => {
  query.mockRejectedValue(new Error('down'))
  const res = await GET(request(signVerification(7, 'ivan@test.com')))

  expect(res.headers.get('location')).toContain('email=expired')
})
