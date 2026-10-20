jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({ withSteamCache: jest.fn() }))
jest.mock('@/lib/xboxClient', () => ({
  ...jest.requireActual('@/lib/xboxClient'),
  findXboxGame: jest.fn(),
  xboxGameAchievements: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { GET } from './route'
import { getServerSession } from 'next-auth'
import { XboxError, findXboxGame, xboxGameAchievements } from '@/lib/xboxClient'
import { xboxAchievementFixture, xboxGameFixture } from '@/test-utils/xboxFixtures'

const GAME = xboxGameFixture()

async function call(qs: string) {
  const res = await GET(new NextRequest(`http://localhost/api/xbox/achievements?${qs}`))
  return { status: res.status, body: (res as unknown as { data: unknown }).data }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', admin: true, xboxxuid: '25354', xboxgamertag: 'TestPlayer' } })
  ;(findXboxGame as jest.Mock).mockResolvedValue(GAME)
  ;(xboxGameAchievements as jest.Mock).mockResolvedValue([xboxAchievementFixture()])
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('401 when not signed in, 403 for a non-admin', async () => {
  ;(getServerSession as jest.Mock).mockResolvedValueOnce(null)
  expect((await call('id=1738914043')).status).toBe(401)
  ;(getServerSession as jest.Mock).mockResolvedValueOnce({ user: { id: '7', xboxxuid: '25354', xboxgamertag: 'x' } })
  expect((await call('id=1738914043')).status).toBe(403)
  expect(findXboxGame).not.toHaveBeenCalled()
})

test.each(['', 'id=abc', 'id=../x', 'id=12345678901'])('400 for a malformed id: %s', async (qs) => {
  expect(await call(qs)).toEqual({ status: 400, body: { error: 'invalid-title' } })
  expect(findXboxGame).not.toHaveBeenCalled()
})

test('404 for a game the account does not have', async () => {
  ;(findXboxGame as jest.Mock).mockResolvedValue(null)
  expect(await call('id=1738914043')).toEqual({ status: 404, body: { error: 'not-in-library' } })
  expect(xboxGameAchievements).not.toHaveBeenCalled()
})

test("the game's achievements, looked up through the user's library, in their language", async () => {
  expect(await call('id=1738914043&lang=es')).toEqual({ status: 200, body: { achievements: [xboxAchievementFixture()] } })
  expect(findXboxGame).toHaveBeenCalledWith('25354', '1738914043', '7')
  expect(xboxGameAchievements).toHaveBeenCalledWith('25354', GAME, '7', 'es-ES')
})

test('an unknown language gets English', async () => {
  await call('id=1738914043&lang=xx')
  expect(xboxGameAchievements).toHaveBeenCalledWith('25354', GAME, '7', 'en-US')
})

test('a hidden profile is 403, anything else 502', async () => {
  ;(xboxGameAchievements as jest.Mock).mockRejectedValueOnce(new XboxError('private', 'x'))
  expect((await call('id=1738914043')).status).toBe(403)
  ;(findXboxGame as jest.Mock).mockRejectedValueOnce(new Error('network'))
  expect((await call('id=1738914043')).status).toBe(502)
})

test('the browser may keep the answer for 5 minutes, privately, and a new session cookie asks again', async () => {
  const res = await GET(new NextRequest('http://localhost/api/xbox/achievements?id=1738914043'))
  expect(res.status).toBe(200)
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=300')
  expect(res.headers.get('Vary')).toBe('Cookie')
})
