jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/psnPoolStatus', () => ({ psnPoolStatus: jest.fn() }))

import { NextRequest, NextResponse } from 'next/server'
import { GET } from './route'
import { requireAdmin } from '@/lib/adminAuth'
import { psnPoolStatus } from '@/lib/psnPoolStatus'
import { psnAccount, psnStatus } from '@/test-utils/psnPoolFixtures'

const req = () => new NextRequest('http://localhost/api/admin/psn/pool') as unknown as Request
const data = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { id: '1', username: 'ivan', pwv: 'x' } })
})

test('the pool at a glance, for an unlocked admin only', async () => {
  const status = psnStatus([psnAccount()])
  ;(psnPoolStatus as jest.Mock).mockResolvedValue(status)
  expect(data(await GET(req()))).toEqual({ pool: status.pool })
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'reauth-required' }, { status: 403 }) })
  expect((await GET(req())).status).toBe(403)
})

test('a database failure is a 500', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(psnPoolStatus as jest.Mock).mockRejectedValue(new Error('down'))
  expect((await GET(req())).status).toBe(500)
  ;(console.error as jest.Mock).mockRestore()
})
