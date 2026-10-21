jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({
  ...jest.requireActual('@/lib/steamCache'),
  withSteamCache: jest.fn(),
  readCacheMany: jest.fn(),
  writeCache: jest.fn(),
}))
jest.mock('@/lib/steamClient', () => ({
  ...jest.requireActual('@/lib/steamClient'),
  // An empty batch: counts come from the per-game calls each test sets up.
  getTopAchievementsForGames: jest.fn(async () => ({ response: { games: [] } })),
  getPlayerAchievements: jest.fn(),
  getSchemaForGame: jest.fn(),
  getGlobalAchievementPercentages: jest.fn(),
  getOwnedGames: jest.fn(),
}))

import { withSteamCache, readCacheMany, writeCache, TTL } from '@/lib/steamCache'
import { getPlayerAchievements, getSchemaForGame, getGlobalAchievementPercentages, getOwnedGames, getTopAchievementsForGames } from '@/lib/steamClient'
import {
  loadPlayerAchievements,
  fetchPlayerAchievements,
  mapWithConcurrency,
  enrichWithAchievementCounts,
  progressCacheKey,
  progressTtl,
  isCountable,
  isNoStats,
  applyUnlocks,
  NO_STATS,
  loadSchema,
  loadGlobalPct,
  loadOwnedGames,
  fetchBatchCounts,
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
    expect(before).toBe(`steamProgress2:765:1:${LONG_AGO * 1000}`)
    expect(after).not.toBe(before)
  })

  test('an undated game gets a stable key', () => {
    expect(progressCacheKey('765', game(1, { rtime_last_played: undefined }))).toBe('steamProgress2:765:1:0')
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
    // Only the counts are stored, never Steam's whole list.
    expect(writeCache).toHaveBeenCalledWith(progressCacheKey('765', g), { total: 4, awarded: 3, lastUnlock: null }, TTL.settledProgress, '7')
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
    expect(writeCache).toHaveBeenCalledWith(expect.any(String), { total: 0, awarded: 0, lastUnlock: null }, TTL.achievements, '7')
  })

  test('cached counts fill the game without calling Steam', async () => {
    const g = game(1)
    ;(readCacheMany as jest.Mock).mockResolvedValue(new Map([[progressCacheKey('765', g), { total: 4, awarded: 1 }]]))

    const { games: [out] } = await enrichWithAchievementCounts([g], AUTH, 10)
    expect(getPlayerAchievements).not.toHaveBeenCalled()
    expect(out).toMatchObject({ achievementsLoaded: true, maxPossible: 4, numAwarded: 1, pctWon: 25 })
  })

  test('cached zero counts (private profile) are a hit that leaves the game unloaded', async () => {
    const g = game(1)
    ;(readCacheMany as jest.Mock).mockResolvedValue(new Map([[progressCacheKey('765', g), { total: 0, awarded: 0 }]]))

    const { games: [out] } = await enrichWithAchievementCounts([g], AUTH, 10)
    expect(getPlayerAchievements).not.toHaveBeenCalled()
    expect(out.achievementsLoaded).toBe(false)
  })

  // Rows written before counts hold the whole list; they must keep working until they expire.
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

describe('loadOwnedGames', () => {
  test('one cached owned list per Steam account, refreshable, for everyone who reads it', async () => {
    ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { game_count: 1, games: [{ appid: 1 }] } })

    expect(await loadOwnedGames(AUTH)).toEqual({ response: { game_count: 1, games: [{ appid: 1 }] } })
    const [key, ttl, , options] = (withSteamCache as jest.Mock).mock.calls[0]
    expect(key).toBe('steamOwnedRaw:765')
    expect(ttl).toBe(TTL.recentlyPlayed)
    expect(options).toMatchObject({ userId: '7', refreshable: true })
    expect(getOwnedGames).toHaveBeenCalledWith('765', 'key')
  })

  test('a private answer is not kept; an empty public library is', async () => {
    ;(withSteamCache as jest.Mock).mockImplementation(async (_k, _t, fetcher) => fetcher())
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: {} })
    await loadOwnedGames(AUTH)
    const { shouldCache } = (withSteamCache as jest.Mock).mock.calls[0][3]
    expect(shouldCache({ response: {} })).toBe(false)
    expect(shouldCache({ response: { game_count: 0 } })).toBe(true)
    expect(shouldCache({ response: { games: [{ appid: 1 }] } })).toBe(true)
  })
})

describe('batched counts', () => {
  /** What GetTopAchievementsForGames answers: the total, and one entry per unlocked achievement. */
  function batch(...games: [number, number, number][]) {
    return { response: { games: games.map(([appid, earned, total]) => ({
      appid, total_achievements: total, achievements: Array.from({ length: earned }, (_, i) => ({ name: `A${i}` })),
    })) } }
  }
  const top = getTopAchievementsForGames as jest.Mock

  test('games in progress are counted from one batch; only finished ones (for their date) and the probe go one by one', async () => {
    top.mockResolvedValueOnce(batch([1, 3, 10], [2, 0, 5], [3, 4, 4], [4, 7, 9]))
    ;(getPlayerAchievements as jest.Mock).mockImplementation(async (_s: string, _k: string, appId: number) =>
      appId === 1 ? unlocks(3, 10) : unlocks(4, 4))
    const games = [game(1), game(2), game(3), game(4)]

    const { games: out, complete } = await enrichWithAchievementCounts(games, AUTH, 10)

    expect(top).toHaveBeenCalledWith('765', 'key', [1, 2, 3, 4])
    // 1 is the privacy probe, 3 is finished: the rest came from the batch.
    expect((getPlayerAchievements as jest.Mock).mock.calls.map((c) => c[2]).sort()).toEqual([1, 3])
    expect(out.map((g) => [g.numAwarded, g.maxPossible])).toEqual([[3, 10], [0, 5], [4, 4], [7, 9]])
    expect(complete).toBe(true)
    expect(writeCache).toHaveBeenCalledWith(progressCacheKey('765', games[3]), { total: 9, awarded: 7, lastUnlock: null }, TTL.settledProgress, '7')
  })

  test('the fetch cap now applies only to what the batch cannot answer', async () => {
    top.mockResolvedValueOnce(batch([1, 1, 10], [2, 1, 10], [3, 1, 10], [4, 2, 2], [5, 3, 3]))
    ;(getPlayerAchievements as jest.Mock).mockImplementation(async (_s: string, _k: string, appId: number) =>
      appId === 1 ? unlocks(1, 10) : unlocks(2, 2))
    const { games: out, complete } = await enrichWithAchievementCounts([1, 2, 3, 4, 5].map((id) => game(id)), AUTH, 1)

    expect(out.map((g) => g.achievementsLoaded)).toEqual([true, true, true, true, false])
    expect(complete).toBe(false)
  })

  test('achievements Steam keeps private stay private: the batch is dropped when the probe says so', async () => {
    top.mockResolvedValueOnce(batch([1, 3, 10], [2, 5, 9]))
    ;(getPlayerAchievements as jest.Mock).mockRejectedValue(Object.assign(new Error('private'), { status: 403 }))

    const { games: out } = await enrichWithAchievementCounts([game(1), game(2)], AUTH, 10)

    expect(out.some((g) => g.numAwarded > 0)).toBe(false)
  })

  test('a failed batch falls back to one call per game', async () => {
    top.mockRejectedValueOnce(new Error('steam down'))
    ;(getPlayerAchievements as jest.Mock).mockResolvedValue(unlocks(2, 4))

    const { games: out, complete } = await enrichWithAchievementCounts([game(1), game(2)], AUTH, 10)

    expect(getPlayerAchievements).toHaveBeenCalledTimes(2)
    expect(out.map((g) => g.numAwarded)).toEqual([2, 2])
    expect(complete).toBe(true)
  })

  test('no misses, no batch', async () => {
    const g = game(1)
    ;(readCacheMany as jest.Mock).mockResolvedValue(new Map([[progressCacheKey('765', g), list(1, 2)]]))
    await enrichWithAchievementCounts([g], AUTH, 10)
    expect(top).not.toHaveBeenCalled()
  })

  test('chunks of 100 games a call', async () => {
    top.mockResolvedValue({ response: { games: [] } })
    expect(await fetchBatchCounts(AUTH, Array.from({ length: 250 }, (_, i) => i + 1))).toEqual(new Map())
    expect(top.mock.calls.map((c) => c[2].length)).toEqual([100, 100, 50])
  })
})
