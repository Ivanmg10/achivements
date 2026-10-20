jest.mock('@/lib/steamCache', () => ({ withSteamCache: jest.fn() }))
jest.mock('@/lib/adminAuth', () => ({ requireAdmin: jest.fn(), logAdminAction: jest.fn() }))
jest.mock('@/lib/xboxClient', () => ({
  ...jest.requireActual('@/lib/xboxClient'),
  findXboxAccount: jest.fn(),
  xboxLibrary: jest.fn(),
  xboxRateLimit: jest.fn(() => ({ remaining: 140, limit: 150 })),
}))

import { NextRequest, NextResponse } from 'next/server'
import { GET } from './route'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { findXboxAccount, XboxError, xboxLibrary } from '@/lib/xboxClient'
import { xboxGameFixture, xboxProfileFixture } from '@/test-utils/xboxFixtures'

const ADMIN = { id: '1', username: 'ivan', pwv: 'x' }
const req = (query = 'gamertag=TestPlayer') => new NextRequest(`http://localhost/api/admin/xbox?${query}`) as unknown as Request
const data = (res: unknown) => (res as { data: unknown }).data

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: ADMIN })
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('only an unlocked admin gets in, and Xbox is never asked otherwise', async () => {
  ;(requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'reauth-required' }, { status: 403 }) })
  expect((await GET(req())).status).toBe(403)
  expect(findXboxAccount).not.toHaveBeenCalled()
})

test('a malformed gamertag is a 400 and never reaches Xbox', async () => {
  for (const q of ['', 'gamertag=', 'gamertag=../../x', `gamertag=${'a'.repeat(30)}`]) {
    expect((await GET(req(q))).status).toBe(400)
  }
  expect(findXboxAccount).not.toHaveBeenCalled()
})

test('the profile, its library and the calls left; the lookup is logged', async () => {
  const profile = xboxProfileFixture()
  const games = [xboxGameFixture()]
  ;(findXboxAccount as jest.Mock).mockResolvedValue(profile)
  ;(xboxLibrary as jest.Mock).mockResolvedValue(games)
  const res = await GET(req())
  expect(res.status).toBe(200)
  expect(data(res)).toEqual({ profile, games, rateLimit: { remaining: 140, limit: 150 } })
  expect(xboxLibrary).toHaveBeenCalledWith(profile.xuid)
  expect(logAdminAction).toHaveBeenCalledWith(ADMIN, 'xbox-lookup', null, { gamertag: 'TestPlayer', xuid: profile.xuid })
})

test('an unknown gamertag is a 404, with no library call and no log', async () => {
  ;(findXboxAccount as jest.Mock).mockResolvedValue(null)
  const res = await GET(req())
  expect(res.status).toBe(404)
  expect(xboxLibrary).not.toHaveBeenCalled()
  expect(logAdminAction).not.toHaveBeenCalled()
})

test.each([
  [new XboxError('not-configured', 'x'), 503, 'not-configured'],
  [new XboxError('private', 'x'), 403, 'private'],
  [new XboxError('rate-limited', 'x'), 429, 'rate-limited'],
  [new Error('boom'), 502, 'failed'],
])('a failure while asking Xbox becomes a structured error (%#)', async (err, status, error) => {
  ;(findXboxAccount as jest.Mock).mockRejectedValue(err)
  const res = await GET(req())
  expect(res.status).toBe(status)
  expect(data(res)).toEqual({ error })
  expect(logAdminAction).not.toHaveBeenCalled()
})

test('a library that fails after the profile was found is a failure too', async () => {
  ;(findXboxAccount as jest.Mock).mockResolvedValue(xboxProfileFixture())
  ;(xboxLibrary as jest.Mock).mockRejectedValue(new XboxError('rate-limited', 'x'))
  expect((await GET(req())).status).toBe(429)
})
