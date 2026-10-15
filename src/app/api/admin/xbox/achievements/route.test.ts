jest.mock('@/lib/steamCache', () => ({ withSteamCache: jest.fn() }))
jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/xboxClient', () => ({
  ...jest.requireActual('@/lib/xboxClient'),
  xboxAchievements: jest.fn(),
  xboxRateLimit: jest.fn(() => ({ remaining: 139, limit: 150 })),
}))

import { NextRequest, NextResponse } from 'next/server'
import { GET } from './route'
import { requireAdmin } from '@/lib/adminAuth'
import { XboxError, xboxAchievements } from '@/lib/xboxClient'
import { xboxAchievementFixture } from '@/test-utils/xboxFixtures'

const XUID = '2535400000000001'
const req = (query = `xuid=${XUID}&titleId=1738914043`) => new NextRequest(`http://localhost/api/admin/xbox/achievements?${query}`) as unknown as Request
const data = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { id: '1', username: 'ivan', pwv: 'x' } })
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('only an unlocked admin gets in', async () => {
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'reauth-required' }, { status: 403 }) })
  expect((await GET(req())).status).toBe(403)
  expect(xboxAchievements).not.toHaveBeenCalled()
})

test.each([
  'xuid=1&titleId=1738914043',
  `xuid=${XUID}&titleId=abc`,
  `xuid=${XUID}`,
  `xuid=${XUID}/../x&titleId=1`,
  '',
])('a bad or missing id is a 400 that never reaches Xbox (%s)', async (query) => {
  expect((await GET(req(query))).status).toBe(400)
  expect(xboxAchievements).not.toHaveBeenCalled()
})

test('the achievements for a modern game', async () => {
  const achievements = [xboxAchievementFixture()]
  ;(xboxAchievements as jest.Mock).mockResolvedValue(achievements)
  const res = await GET(req())
  expect(res.status).toBe(200)
  expect(data(res)).toEqual({ achievements, rateLimit: { remaining: 139, limit: 150 } })
  expect(xboxAchievements).toHaveBeenCalledWith(XUID, '1738914043', false)
})

test('is360=1 asks for the Xbox 360 endpoint', async () => {
  ;(xboxAchievements as jest.Mock).mockResolvedValue([])
  await GET(req(`xuid=${XUID}&titleId=1096157159&is360=1`))
  expect(xboxAchievements).toHaveBeenCalledWith(XUID, '1096157159', true)
})

test('an Xbox failure is a structured error', async () => {
  ;(xboxAchievements as jest.Mock).mockRejectedValue(new XboxError('rate-limited', 'x'))
  const res = await GET(req())
  expect(res.status).toBe(429)
  expect(data(res)).toEqual({ error: 'rate-limited' })
  ;(xboxAchievements as jest.Mock).mockRejectedValue(new Error('boom'))
  expect((await GET(req())).status).toBe(502)
})
