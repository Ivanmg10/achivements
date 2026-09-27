jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
  readCacheMany: jest.fn(),
  writeCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  getPlayerAchievements: jest.fn(),
  getOwnedGames: jest.fn(),
  getSchemaForGame: jest.fn(),
  getGlobalAchievementPercentages: jest.fn(),
}))

import { withSteamCache, readCacheMany, writeCache, TTL } from '@/lib/steamCache'
import { getPlayerAchievements, getOwnedGames, getSchemaForGame, getGlobalAchievementPercentages } from '@/lib/steamClient'
import {
  loadPlayerAchievements,
  fetchPlayerAchievements,
  mapWithConcurrency,
  enrichWithAchievementCounts,
  loadOwnedFacts,
  progressCacheKey,
  progressTtl,
  isCountable,
  isNoStats,
  applyUnlocks,
  NO_STATS,
  loadSchema,
  loadGlobalPct,
} from './steamProgress'
import { toSteamGameProgress } from '@/utils/steamMappers'

const AUTH = { id: '7', steamid: '765', apiKey: 'key' }
const LONG_AGO = 1_600_000_000 // 2020 — settled

function game(appid: number, overrides: Record<string, unknown> = {}) {
  return toSteamGameProgress({
    appid,
    name: `Game ${appid}`,
    playtime_forever: 100,
    has_community_visible_stats: true,
    rtime_last_played: LONG_AGO,
    ...overrides,
  })
}

function list(earned: number, total: number) {
  return Array.from({ length: total }, (_, i) => ({ apiname: `A${i}`, achieved: (i < earned ? 1 : 0) as 0 | 1, unlocktime: 0 }))
}

function unlocks(earned: number, total: number) {
  return { playerstats: { success: true, achievements: list(earned, total) } }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
  ;(readCacheMany as jest.Mock).mockResolvedValue(new Map())
  ;(writeCache as jest.Mock).mockResolvedValue(undefined)
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

describe('fetchPlayerAchievements', () => {
  test('returns the unlock list', async () => {
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue(unlocks(1, 2))
    await expect(fetchPlayerAchievements(AUTH, 730)).resolves.toHaveLength(2)
  })

  test('returns [] for an unsuccessful payload', async () => {
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue({ playerstats: { success: false } })
    await expect(fetchPlayerAchievements(AUTH, 730)).resolves.toEqual([])
  })

  test('returns [] when a successful payload carries no list', async () => {
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue({ playerstats: { success: true } })
    await expect(fetchPlayerAchievements(AUTH, 730)).resolves.toEqual([])
  })

  test('degrades a private profile (403) to []', async () => {
    ;(getPlayerAchievements as jest.Mock).mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }))
    await expect(fetchPlayerAchievements(AUTH, 730)).resolves.toEqual([])
  })

  test('rethrows any other failure', async () => {
    ;(getPlayerAchievements as jest.Mock).mockRejectedValue(Object.assign(new Error('boom'), { status: 500 }))
    await expect(fetchPlayerAchievements(AUTH, 730)).rejects.toThrow('boom')
  })
})

test('loadPlayerAchievements caches the detail view per player+game for an hour', async () => {
  ;(getPlayerAchievements as jest.Mock).mockResolvedValue(unlocks(1, 2))

  await expect(loadPlayerAchievements(AUTH, 730)).resolves.toHaveLength(2)
  const [key, ttl, , options] = (withSteamCache as jest.Mock).mock.calls[0]
  expect(key).toBe('steamAch:765:730')
  expect(ttl).toBe(TTL.achievements)
  expect(options).toEqual({ userId: '7' })
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

describe('progress cache key and TTL', () => {
  test('the key moves when the game is played again', () => {
    const before = progressCacheKey('765', game(1, { rtime_last_played: LONG_AGO }))
    const after = progressCacheKey('765', game(1, { rtime_last_played: LONG_AGO + 3600 }))
    expect(before).toBe(`steamProgress:765:1:${LONG_AGO * 1000}`)
    expect(after).not.toBe(before)
  })

  test('an undated game gets a stable key', () => {
    expect(progressCacheKey('765', game(1, { rtime_last_played: undefined }))).toBe('steamProgress:765:1:0')
  })

  test('settled games keep counts for a month; ones played in the last 48h for an hour', () => {
    const now = Date.parse('2026-09-21T12:00:00Z')
    const old = game(1, { rtime_last_played: Math.floor(now / 1000) - 3 * 24 * 3600 })
    const active = game(2, { rtime_last_played: Math.floor(now / 1000) - 3600 })

    expect(progressTtl(old, now)).toBe(TTL.settledProgress)
    expect(progressTtl(active, now)).toBe(TTL.achievements)
    expect(progressTtl(game(3, { rtime_last_played: undefined }), now)).toBe(TTL.settledProgress)
  })

  test('only played games with achievements are countable', () => {
    expect(isCountable(game(1))).toBe(true)
    expect(isCountable(game(1, { playtime_forever: 0 }))).toBe(false)
    expect(isCountable(game(1, { has_community_visible_stats: false }))).toBe(false)
  })
})

describe('enrichWithAchievementCounts', () => {
  test('fetches a miss, fills counts and caches it by last-played time', async () => {
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue(unlocks(3, 4))
    const g = game(1)
    const { games: [out], complete } = await enrichWithAchievementCounts([g], AUTH, 10)

    expect(complete).toBe(true)
    expect(out).toMatchObject({ achievementsLoaded: true, maxPossible: 4, numAwarded: 3, pctWon: 75 })
    expect(writeCache).toHaveBeenCalledWith(progressCacheKey('765', g), list(3, 4), TTL.settledProgress, '7')
  })

  test('reads every cached game in one query and spends no Steam call on hits', async () => {
    const games = [game(1), game(2)]
    ;(readCacheMany as jest.Mock).mockResolvedValue(new Map([
      [progressCacheKey('765', games[0]), list(2, 2)],
      [progressCacheKey('765', games[1]), list(1, 4)],
    ]))

    const { games: out, complete } = await enrichWithAchievementCounts(games, AUTH, 10)

    expect(readCacheMany).toHaveBeenCalledTimes(1)
    expect(getPlayerAchievements).not.toHaveBeenCalled()
    expect(out.map((g) => g.numAwarded)).toEqual([2, 1])
    expect(complete).toBe(true)
  })

  test('the fetch cap counts only misses — cached games are always filled', async () => {
    const games = [game(1), game(2), game(3), game(4)]
    ;(readCacheMany as jest.Mock).mockResolvedValue(new Map([[progressCacheKey('765', games[0]), list(1, 1)]]))
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue(unlocks(1, 1))

    const { games: out, complete } = await enrichWithAchievementCounts(games, AUTH, 2)

    expect(getPlayerAchievements).toHaveBeenCalledTimes(2)
    expect(out.map((g) => g.achievementsLoaded)).toEqual([true, true, true, false])
    expect(complete).toBe(false)
  })

  test('skips games without stats and games never played — no call spent', async () => {
    const games = [game(1, { has_community_visible_stats: false }), game(2, { playtime_forever: 0 })]
    const { games: out, complete } = await enrichWithAchievementCounts(games, AUTH, 10)

    expect(getPlayerAchievements).not.toHaveBeenCalled()
    expect(out.every((g) => !g.achievementsLoaded)).toBe(true)
    expect(complete).toBe(true)
  })

  test('one failing game leaves just that game unloaded and marks the fill incomplete', async () => {
    ;(getPlayerAchievements as jest.Mock)
      .mockResolvedValueOnce(unlocks(1, 1))
      .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }))
      .mockResolvedValueOnce(unlocks(1, 1))

    const { games: out, complete } = await enrichWithAchievementCounts([game(1), game(2), game(3)], AUTH, 10)
    expect(out.map((g) => g.achievementsLoaded)).toEqual([true, false, true])
    expect(complete).toBe(false)
  })

  test('caches a private profile briefly, not for a month', async () => {
    ;(getPlayerAchievements as jest.Mock).mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }))
    const { games: [out], complete } = await enrichWithAchievementCounts([game(1)], AUTH, 10)

    expect(out.achievementsLoaded).toBe(false)
    expect(complete).toBe(true)
    expect(writeCache).toHaveBeenCalledWith(expect.any(String), [], TTL.achievements, '7')
  })

  test('a cached empty list counts as a hit — no refetch on every page load', async () => {
    const g = game(1)
    ;(readCacheMany as jest.Mock).mockResolvedValue(new Map([[progressCacheKey('765', g), []]]))

    const { games: [out] } = await enrichWithAchievementCounts([g], AUTH, 10)
    expect(getPlayerAchievements).not.toHaveBeenCalled()
    expect(out.achievementsLoaded).toBe(false)
  })

  test('fills the whole of a large library over successive calls', async () => {
    // The shape of a real library: 15 perfect games spread across 160 countable ones.
    const games = Array.from({ length: 160 }, (_, i) => game(i + 1))
    const perfect = new Set([6, 15, 23, 28, 40, 42, 49, 55, 57, 59, 73, 137, 145, 147, 150])
    const store = new Map<string, unknown>()
    ;(readCacheMany as jest.Mock).mockImplementation(async (keys: string[]) =>
      new Map(keys.filter((k) => store.has(k)).map((k) => [k, store.get(k)])))
    ;(writeCache as jest.Mock).mockImplementation(async (k: string, v: unknown) => { store.set(k, v) })
    ;(getPlayerAchievements as jest.Mock).mockImplementation(async (_s: string, _k: string, appId: number) =>
      unlocks(perfect.has(appId) ? 10 : 3, 10))

    let result = await enrichWithAchievementCounts(games, AUTH, 60)
    let calls = 1
    while (!result.complete) {
      result = await enrichWithAchievementCounts(games, AUTH, 60)
      calls++
    }

    expect(calls).toBe(3)
    expect(getPlayerAchievements).toHaveBeenCalledTimes(160)
    expect(result.games.filter((g) => g.numAwarded === g.maxPossible && g.achievementsLoaded)).toHaveLength(15)
  })
})

describe('loadOwnedFacts', () => {
  test('maps appid to the facts the recent list leaves out', async () => {
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { games: [
      { appid: 1, playtime_forever: 5, rtime_last_played: 1700000000, has_community_visible_stats: true },
      { appid: 2, playtime_forever: 0, rtime_last_played: 0, has_community_visible_stats: false },
      { appid: 3, playtime_forever: 0 },
    ] } })

    const facts = await loadOwnedFacts(AUTH)
    expect(facts.get(1)).toEqual({ rtime_last_played: 1700000000, has_community_visible_stats: true })
    // A zero timestamp means never played, not 1970.
    expect(facts.get(2)).toEqual({ rtime_last_played: undefined, has_community_visible_stats: false })
    expect(facts.get(3)).toEqual({ rtime_last_played: undefined, has_community_visible_stats: undefined })
  })

  test('returns an empty map for a private profile', async () => {
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: {} })
    await expect(loadOwnedFacts(AUTH)).resolves.toEqual(new Map())
  })

  test('returns an empty map instead of throwing when Steam fails', async () => {
    ;(getOwnedGames as jest.Mock).mockRejectedValue(new Error('steam down'))
    await expect(loadOwnedFacts(AUTH)).resolves.toEqual(new Map())
  })
})

describe('games Steam says have no stats (400)', () => {
  const lab = () => game(450390, { name: 'The Lab' })
  const noStats400 = () => Object.assign(new Error('Steam API error 400'), { status: 400 })

  test('fetchPlayerAchievements reports NO_STATS, distinct from a private profile', async () => {
    ;(getPlayerAchievements as jest.Mock).mockRejectedValue(noStats400())
    const unlocks = await fetchPlayerAchievements(AUTH, 450390)
    expect(isNoStats(unlocks)).toBe(true)
    expect(isNoStats([])).toBe(false)
  })

  test('the game becomes one with no achievements — not unknown, not retried', async () => {
    ;(getPlayerAchievements as jest.Mock).mockRejectedValue(noStats400())
    const g = lab()
    const { games: [out], complete } = await enrichWithAchievementCounts([g], AUTH, 10)

    expect(complete).toBe(true)
    expect(out.hasStats).toBe(false)
    expect(isCountable(out)).toBe(false)
    // Final, so it gets the settled TTL rather than the short "unknown" one.
    expect(writeCache).toHaveBeenCalledWith(progressCacheKey('765', g), NO_STATS, TTL.settledProgress, '7')
  })

  test('a cached NO_STATS is applied without calling Steam', async () => {
    const g = lab()
    ;(readCacheMany as jest.Mock).mockResolvedValue(new Map([[progressCacheKey('765', g), NO_STATS]]))

    const { games: [out] } = await enrichWithAchievementCounts([g], AUTH, 10)
    expect(getPlayerAchievements).not.toHaveBeenCalled()
    expect(out.hasStats).toBe(false)
  })

  test('the detail view gets an empty list for it', async () => {
    ;(getPlayerAchievements as jest.Mock).mockRejectedValue(noStats400())
    await expect(loadPlayerAchievements(AUTH, 450390)).resolves.toEqual([])
  })

  test('applyUnlocks counts a normal list as before', () => {
    expect(applyUnlocks(lab(), list(1, 2))).toMatchObject({ achievementsLoaded: true, numAwarded: 1, maxPossible: 2 })
  })
})

describe('loadSchema', () => {
  test('returns the definitions, cached for everyone per language', async () => {
    ;(getSchemaForGame as jest.Mock).mockResolvedValue({
      game: { availableGameStats: { achievements: [{ name: 'A' }] } },
    })
    await expect(loadSchema(730, 'key', 'spanish')).resolves.toEqual([{ name: 'A' }])

    const [key, ttl, , options] = (withSteamCache as jest.Mock).mock.calls[0]
    expect(key).toBe('steamSchema:730:spanish')
    expect(ttl).toBe(TTL.schema)
    expect(options).toBeUndefined()
    expect(getSchemaForGame).toHaveBeenCalledWith(730, 'key', 'spanish')
  })

  test('returns [] for a game without achievements', async () => {
    ;(getSchemaForGame as jest.Mock).mockResolvedValue({ game: {} })
    await expect(loadSchema(1, 'key', 'english')).resolves.toEqual([])
  })
})

describe('loadGlobalPct', () => {
  test('returns each achievement’s global share, cached for everyone for a day', async () => {
    ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
    ;(getGlobalAchievementPercentages as jest.Mock).mockResolvedValue({
      achievementpercentages: { achievements: [{ name: 'WIN', percent: 12.5 }] },
    })
    const pct = await loadGlobalPct(620)
    expect(pct.get('WIN')).toBe(12.5)
    const [key, ttl] = (withSteamCache as jest.Mock).mock.calls.at(-1)
    expect(key).toBe('steamGlobalPct:620')
    expect(ttl).toBe(TTL.schema)
  })

  test('is empty when Steam will not give it', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(withSteamCache as jest.Mock).mockRejectedValue(new Error('down'))
    expect((await loadGlobalPct(620)).size).toBe(0)
  })
})
