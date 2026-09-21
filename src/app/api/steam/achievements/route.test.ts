jest.mock('@/lib/authOptions', () => ({ authOptions: {} }))
jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  getPlayerAchievements: jest.fn(),
  getSchemaForGame: jest.fn(),
  getGlobalAchievementPercentages: jest.fn(),
}))

import { GET } from './route'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { withSteamCache } from '@/lib/steamCache'
import { getPlayerAchievements, getSchemaForGame, getGlobalAchievementPercentages } from '@/lib/steamClient'
import type { SteamAchievementUnified } from '@/types/steam'

const SCHEMA = [
  { name: 'ACH_WIN', defaultvalue: 0, displayName: 'Win', hidden: 0, icon: 'i.jpg', icongray: 'g.jpg' },
]

function makeRequest(appid?: string) {
  const url = new URL('http://localhost:3000/api/steam/achievements')
  if (appid !== undefined) url.searchParams.set('appid', appid)
  return new NextRequest(url.toString())
}

function data(res: unknown) {
  return (res as { data: SteamAchievementUnified[] }).data
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.STEAM_API_KEY = 'steam-key'
  ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: '7', steamid: '765' } })
  ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
  ;(getSchemaForGame as jest.Mock).mockResolvedValue({
    game: { availableGameStats: { achievements: SCHEMA } },
  })
  ;(getPlayerAchievements as jest.Mock).mockResolvedValue({
    playerstats: { success: true, achievements: [{ apiname: 'ACH_WIN', achieved: 1, unlocktime: 1700000000 }] },
  })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

describe('request validation', () => {
  test('returns 401 when not signed in', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    expect((await GET(makeRequest('730'))).status).toBe(401)
  })

  test.each([undefined, '', 'abc', '-1', '7.5'])('rejects appid %p with 400', async (appid) => {
    expect((await GET(makeRequest(appid))).status).toBe(400)
    expect(getSchemaForGame).not.toHaveBeenCalled()
  })
})

test('joins the schema with the player unlock state', async () => {
  const achievements = data(await GET(makeRequest('730')))
  expect(achievements).toHaveLength(1)
  expect(achievements[0].title).toBe('Win')
  expect(achievements[0].dateEarned).toBe('2023-11-14T22:13:20.000Z')
  expect(achievements[0].badgeUrl).toBe('i.jpg')
})

test('skips the per-player call for a game with no achievements', async () => {
  ;(getSchemaForGame as jest.Mock).mockResolvedValue({ game: { availableGameStats: {} } })

  const res = await GET(makeRequest('730'))
  expect(data(res)).toEqual([])
  expect(getPlayerAchievements).not.toHaveBeenCalled()
  // Cached for the long schema TTL — a game without achievements will not grow any.
  expect(res.headers.get('Cache-Control')).toBe('private, max-age=86400')
})

test('caches the schema globally and the unlock state per player', async () => {
  await GET(makeRequest('730'))

  const [schemaCall, playerCall] = (withSteamCache as jest.Mock).mock.calls
  expect(schemaCall[0]).toBe('steamSchema:730:english')
  expect(schemaCall[3]).toBeUndefined()
  expect(playerCall[0]).toBe('steamAch:765:730')
  expect(playerCall[3]).toEqual({ userId: '7' })
})

test('still renders everything locked when the profile is private (403)', async () => {
  ;(getPlayerAchievements as jest.Mock).mockRejectedValue(
    Object.assign(new Error('Forbidden'), { status: 403 }),
  )

  const achievements = data(await GET(makeRequest('730')))
  expect(achievements).toHaveLength(1)
  expect(achievements[0].earned).toBe(false)
  expect(achievements[0].dateEarned).toBeNull()
})

test('treats an unsuccessful playerstats payload as no unlocks', async () => {
  ;(getPlayerAchievements as jest.Mock).mockResolvedValue({ playerstats: { success: false } })
  expect(data(await GET(makeRequest('730')))[0].dateEarned).toBeNull()
})

test('returns 503 when the schema call fails', async () => {
  ;(getSchemaForGame as jest.Mock).mockRejectedValue(new Error('steam down'))
  expect((await GET(makeRequest('730'))).status).toBe(503)
})

test('returns 503 when the player call fails for a reason other than privacy', async () => {
  ;(getPlayerAchievements as jest.Mock).mockRejectedValue(
    Object.assign(new Error('boom'), { status: 500 }),
  )
  expect((await GET(makeRequest('730'))).status).toBe(503)
})

describe('language and rarity', () => {
  beforeEach(() => {
    ;(getGlobalAchievementPercentages as jest.Mock).mockResolvedValue({
      achievementpercentages: { achievements: [{ name: 'ACH_WIN', percent: '12.5' }] },
    })
  })

  test('asks Steam for the requested language and caches the schema per language', async () => {
    const url = new URL('http://localhost:3000/api/steam/achievements?appid=730&lang=spanish')
    await GET(new NextRequest(url.toString()))

    expect(getSchemaForGame).toHaveBeenCalledWith(730, 'steam-key', 'spanish')
    expect((withSteamCache as jest.Mock).mock.calls[0][0]).toBe('steamSchema:730:spanish')
  })

  test('falls back to English for a language Steam does not know', async () => {
    const url = new URL('http://localhost:3000/api/steam/achievements?appid=730&lang=klingon')
    await GET(new NextRequest(url.toString()))
    expect(getSchemaForGame).toHaveBeenCalledWith(730, 'steam-key', 'english')
  })

  test('attaches global rarity, cached for everyone', async () => {
    const [a] = data(await GET(makeRequest('730')))
    expect(a.globalPct).toBe(12.5)
    const keys = (withSteamCache as jest.Mock).mock.calls.map((c) => c[0])
    expect(keys).toContain('steamGlobalPct:730')
  })

  test('still returns the achievements when rarity is unavailable', async () => {
    ;(getGlobalAchievementPercentages as jest.Mock).mockRejectedValue(new Error('steam down'))
    const [a] = data(await GET(makeRequest('730')))
    expect(a.title).toBe('Win')
    expect(a.globalPct).toBeNull()
  })
})
