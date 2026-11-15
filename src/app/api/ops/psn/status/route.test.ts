jest.mock('@/lib/attemptLimit', () => ({ allowAttempt: jest.fn(async () => true), clientAddress: () => '1.2.3.4' }))
jest.mock('@/lib/psnPoolStatus', () => ({ ...jest.requireActual('@/lib/psnPoolStatus'), psnPoolStatus: jest.fn() }))
jest.mock('@/lib/preDb', () => ({ preDatabase: jest.fn() }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { allowAttempt } from '@/lib/attemptLimit'
import { psnPoolStatus } from '@/lib/psnPoolStatus'
import { psnAccount, psnStatus } from '@/test-utils/psnPoolFixtures'

const call = (authorization?: string) =>
  GET(new NextRequest('http://localhost/api/ops/psn/status', { headers: authorization ? { authorization } : {} }) as unknown as Request)
const data = (res: unknown) => (res as { data: Record<string, unknown> }).data

beforeEach(() => {
  jest.clearAllMocks()
  process.env.PSN_STATUS_TOKEN = 'status-token'
  ;(psnPoolStatus as jest.Mock).mockResolvedValue(psnStatus([psnAccount({ hint: 'the blue one' })]))
})

afterEach(() => {
  delete process.env.PSN_STATUS_TOKEN
  delete process.env.VERCEL_ENV
})

test('does not exist without PSN_STATUS_TOKEN', async () => {
  delete process.env.PSN_STATUS_TOKEN
  expect((await call('Bearer status-token')).status).toBe(404)
})

test('a wrong or missing token is a 401, and counts against the limit', async () => {
  expect((await call('Bearer nope')).status).toBe(401)
  expect((await call()).status).toBe(401)
  expect(allowAttempt).toHaveBeenCalledWith('psn-status', '1.2.3.4')
  expect(psnPoolStatus).not.toHaveBeenCalled()
})

test('too many tries is a 429 before the token is even compared', async () => {
  ;(allowAttempt as jest.Mock).mockResolvedValueOnce(false)
  expect((await call('Bearer status-token')).status).toBe(429)
})

test('the right token reads which environment and the pool, nothing secret', async () => {
  process.env.VERCEL_ENV = 'preview'
  const res = await call('Bearer status-token')
  expect(res.status).toBe(200)
  expect(data(res)).toMatchObject({ environment: 'PRE', pool: { accounts: 1 }, accounts: [{ label: 'PSN-1', status: 'active' }] })
  expect(JSON.stringify(data(res))).not.toContain('blue')
})

test('a database failure is a 500', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(psnPoolStatus as jest.Mock).mockRejectedValue(new Error('down'))
  expect((await call('Bearer status-token')).status).toBe(500)
  ;(console.error as jest.Mock).mockRestore()
})
