jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  getPlayerAchievements: jest.fn(),
}))

import { withSteamCache } from '@/lib/steamCache'
import { getPlayerAchievements } from '@/lib/steamClient'
import { loadPlayerAchievements, mapWithConcurrency, enrichWithAchievementCounts } from './steamProgress'
import { toSteamGameProgress } from '@/utils/steamMappers'

const AUTH = { id: '7', steamid: '765', apiKey: 'key' }

function game(appid: number, overrides: Record<string, unknown> = {}) {
  return toSteamGameProgress({
    appid,
    name: `Game ${appid}`,
    playtime_forever: 100,
    has_community_visible_stats: true,
    ...overrides,
  })
}

function unlocks(earned: number, total: number) {
  return {
    playerstats: {
      success: true,
      achievements: Array.from({ length: total }, (_, i) => ({
        apiname: `A${i}`, achieved: i < earned ? 1 : 0, unlocktime: 0,
      })),
    },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

describe('loadPlayerAchievements', () => {
  test('returns the unlock list and caches it per player+game', async () => {
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue(unlocks(1, 2))

    await expect(loadPlayerAchievements(AUTH, 730)).resolves.toHaveLength(2)
    const [key, , , options] = (withSteamCache as jest.Mock).mock.calls[0]
    expect(key).toBe('steamAch:765:730')
    expect(options).toEqual({ userId: '7' })
  })

  test('returns [] for an unsuccessful payload', async () => {
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue({ playerstats: { success: false } })
    await expect(loadPlayerAchievements(AUTH, 730)).resolves.toEqual([])
  })

  test('returns [] when a successful payload carries no list', async () => {
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue({ playerstats: { success: true } })
    await expect(loadPlayerAchievements(AUTH, 730)).resolves.toEqual([])
  })

  test('degrades a private profile (403) to []', async () => {
    ;(getPlayerAchievements as jest.Mock).mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }))
    await expect(loadPlayerAchievements(AUTH, 730)).resolves.toEqual([])
  })

  test('rethrows any other failure', async () => {
    ;(getPlayerAchievements as jest.Mock).mockRejectedValue(Object.assign(new Error('boom'), { status: 500 }))
    await expect(loadPlayerAchievements(AUTH, 730)).rejects.toThrow('boom')
  })
})

describe('mapWithConcurrency', () => {
  test('preserves input order', async () => {
    const out = await mapWithConcurrency([30, 10, 20], 2, async (ms) => {
      await new Promise((r) => setTimeout(r, ms))
      return ms
    })
    expect(out).toEqual([30, 10, 20])
  })

  test('never runs more than the limit at once', async () => {
    let active = 0
    let peak = 0
    await mapWithConcurrency(Array.from({ length: 10 }, (_, i) => i), 3, async () => {
      active++
      peak = Math.max(peak, active)
      await new Promise((r) => setTimeout(r, 5))
      active--
    })
    expect(peak).toBe(3)
  })

  test('handles an empty list', async () => {
    await expect(mapWithConcurrency([], 4, async (x) => x)).resolves.toEqual([])
  })
})

describe('enrichWithAchievementCounts', () => {
  test('fills counts for eligible games', async () => {
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue(unlocks(3, 4))
    const [g] = await enrichWithAchievementCounts([game(1)], AUTH, 10)

    expect(g.achievementsLoaded).toBe(true)
    expect(g.maxPossible).toBe(4)
    expect(g.numAwarded).toBe(3)
    expect(g.pctWon).toBe(75)
  })

  test('skips games without stats and games never played — no call spent', async () => {
    const games = [game(1, { has_community_visible_stats: false }), game(2, { playtime_forever: 0 })]
    const out = await enrichWithAchievementCounts(games, AUTH, 10)

    expect(getPlayerAchievements).not.toHaveBeenCalled()
    expect(out.every((g) => !g.achievementsLoaded)).toBe(true)
  })

  test('spends the budget on the first eligible games in the given order', async () => {
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue(unlocks(1, 1))
    const out = await enrichWithAchievementCounts([game(1), game(2), game(3)], AUTH, 2)

    expect(getPlayerAchievements).toHaveBeenCalledTimes(2)
    expect(out.map((g) => g.achievementsLoaded)).toEqual([true, true, false])
  })

  test('ineligible games do not consume budget', async () => {
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue(unlocks(1, 1))
    const out = await enrichWithAchievementCounts(
      [game(1, { has_community_visible_stats: false }), game(2), game(3)],
      AUTH,
      2,
    )
    expect(out.map((g) => g.achievementsLoaded)).toEqual([false, true, true])
  })

  test('one failing game leaves just that game unloaded', async () => {
    ;(getPlayerAchievements as jest.Mock)
      .mockResolvedValueOnce(unlocks(1, 1))
      .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }))
      .mockResolvedValueOnce(unlocks(1, 1))

    const out = await enrichWithAchievementCounts([game(1), game(2), game(3)], AUTH, 10)
    expect(out.map((g) => g.achievementsLoaded)).toEqual([true, false, true])
  })

  test('a private profile leaves games unloaded rather than 0/0', async () => {
    ;(getPlayerAchievements as jest.Mock).mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }))
    const [g] = await enrichWithAchievementCounts([game(1)], AUTH, 10)
    expect(g.achievementsLoaded).toBe(false)
  })
})
