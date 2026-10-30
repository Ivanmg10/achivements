jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn(), connect: jest.fn() } }))
jest.mock('@/lib/raClient', () => ({ getGameInfoAndUserProgress: jest.fn(), getUserCompletionProgress: jest.fn() }))
jest.mock('@/lib/steamClient', () => ({ getOwnedGames: jest.fn() }))
jest.mock('@/lib/steamCache', () => ({
  withSteamCache: jest.fn((_k: string, _t: number, f: () => unknown) => f()),
  readCache: jest.fn(),
  writeCache: jest.fn(),
}))
jest.mock('@/lib/steamProgress', () => ({ fetchPlayerAchievements: jest.fn(), isNoStats: () => false, loadGlobalPct: jest.fn(async () => new Map()) }))
jest.mock('@/lib/attemptLimit', () => ({ allowAttempt: jest.fn(async () => true) }))
jest.mock('@/lib/psnClient', () => {
  class PsnError extends Error {
    get isPrivate() {
      return /privacy/.test(this.message)
    }
    get isRateLimited() {
      return /too many requests/.test(this.message)
    }
  }
  return { PsnError, psnTitles: jest.fn(), psnGameTrophies: jest.fn() }
})
jest.mock('@/lib/xboxClient', () => {
  class XboxError extends Error {
    kind: string
    constructor(kind: string, message: string) {
      super(message)
      this.kind = kind
    }
  }
  return { XboxError, xboxLibrary: jest.fn(), xboxGameAchievements: jest.fn() }
})

import pool from '@/lib/db'
import { readCache, writeCache } from '@/lib/steamCache'
import { allowAttempt } from '@/lib/attemptLimit'
import { PsnError, psnGameTrophies, psnTitles } from '@/lib/psnClient'
import { XboxError } from '@/lib/xboxClient'
import { getGameInfoAndUserProgress, getUserCompletionProgress } from '@/lib/raClient'
import { getOwnedGames } from '@/lib/steamClient'
import { fetchPlayerAchievements } from '@/lib/steamProgress'
import { RULES_VERSION } from '@/utils/vaultScore'
import { classifyFailure, continueFill, onPlatformLinked, PACE, refreshScore, refreshScoreIfStale, runScorePass } from './scoreRefresh'

const query = pool.query as jest.Mock
const client = { query: jest.fn(), release: jest.fn() }

const counts = (b: number) => ({ bronze: b, silver: 0, gold: 0, platinum: 0 })
const game = (id: number, consoleName: string, lastTrophyAt: string) => ({
  id, title: `Game ${id}`, consoleName, lastTrophyAt, earned: counts(2), defined: counts(4), titleId: `NPWR${id}`, service: 'trophy2',
})
const trophy = (earned: boolean, rarity: number) => ({ id: 1, name: '', detail: '', iconUrl: null, type: 'bronze', groupId: 'default', hidden: false, earned, earnedAt: earned ? '2026-10-20T10:00:00Z' : null, rarity })
const user = (over: Record<string, unknown>) => ({ id: 7, rausername: null, raid: null, steamid: null, psnaccountid: null, xboxxuid: null, preferences: {}, ...over })

let stored: Record<string, unknown>[]
let writes: { game_id: number; provisional: boolean; points: number }[]
let kept: number[] | null
let userRow: Record<string, unknown>

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  stored = [
    { game_id: '2', account: 'acc', title: 'Game 2', points: 300, change_key: 'k2', rules_version: RULES_VERSION, provisional: false, flag: null },
    { game_id: '9', account: 'acc', title: 'Gone', points: 100, change_key: 'k9', rules_version: RULES_VERSION, provisional: false, flag: null },
  ]
  writes = []
  kept = null
  userRow = user({ psnaccountid: 'acc', preferences: { 'hidden-consoles:psn': '["PS3"]' } })
  ;(pool.connect as jest.Mock).mockResolvedValue(client)
  client.query.mockResolvedValue({ rows: [] })
  ;(allowAttempt as jest.Mock).mockResolvedValue(true)
  query.mockImplementation(async (sql: string, params: unknown[]) => {
    if (sql.includes('FROM users WHERE id')) return { rows: [userRow] }
    if (sql.includes('FROM hidden_games')) return { rows: [{ source: 'psn', game_id: 3 }] }
    if (sql.includes('SELECT game_id, account')) return { rows: stored }
    if (sql.includes('INSERT INTO score_games')) {
      writes = JSON.parse(params[4] as string)
      return { rowCount: writes.length }
    }
    if (sql.includes('AND source = $2 AND NOT (game_id')) {
      kept = params[2] as number[]
      return { rowCount: 1 }
    }
    if (sql.includes('SUM(points * stack_factor)')) return { rows: [{ points: 1234.4 }] }
    if (sql.includes('UPDATE users SET score_refreshed_at')) return { rowCount: 1 }
    return { rows: [], rowCount: 0 }
  })
  ;(psnTitles as jest.Mock).mockResolvedValue([game(1, 'PS5', 'k1-new'), game(2, 'PS4', 'k2'), game(3, 'PS5', 'k3'), game(4, 'PS3', 'k4')])
  ;(psnGameTrophies as jest.Mock).mockResolvedValue([trophy(true, 60), trophy(true, 30), trophy(false, 5), trophy(false, 2), trophy(false, 1)])
})

describe('refreshScore', () => {
  it('reads only what moved, leaves out hidden games and consoles, and drops what left', async () => {
    const reports: unknown[] = []
    const result = await refreshScore(7, Date.now() + 10_000, (source, p) => reports.push([source, p]))
    // Game 1 moved; game 2 is as it was scored; 3 is hidden, 4 is on an unticked console.
    expect(psnGameTrophies).toHaveBeenCalledTimes(1)
    expect(writes.map((w) => [w.game_id, w.provisional])).toEqual([[1, false]])
    expect([...(kept ?? [])].sort()).toEqual([1, 2])
    expect(result).toEqual({ complete: true, platforms: { psn: { read: 2, total: 2, state: 'done' } } })
    expect(reports[0]).toEqual(['psn', { read: 1, total: 2, state: 'reading' }])
    expect(client.query).toHaveBeenCalledWith('COMMIT')
  })

  it('out of time, a moved game stands in from the list and the fill is unfinished', async () => {
    stored = []
    const result = await refreshScore(7, Date.now() - 1)
    expect(psnGameTrophies).not.toHaveBeenCalled()
    expect(writes.map((w) => [w.game_id, w.provisional]).sort()).toEqual([[1, true], [2, true]])
    expect(result.complete).toBe(false)
    expect(result.platforms.psn).toEqual({ read: 0, total: 2, state: 'reading' })
  })

  it('a private platform keeps its scores and settles as an error to show', async () => {
    ;(psnTitles as jest.Mock).mockRejectedValue(new PsnError('privacy settings'))
    const result = await refreshScore(7, Date.now() + 10_000)
    expect(writes).toEqual([])
    expect(kept).toBeNull()
    expect(result).toEqual({ complete: true, platforms: { psn: { read: 0, total: 0, state: 'error', error: 'private' } } })
  })

  it('PSN goes gently: 100 games a pass, and stops when Sony or the app-wide budget says so', async () => {
    stored = []
    userRow = user({ psnaccountid: 'acc' })
    ;(psnTitles as jest.Mock).mockResolvedValue(Array.from({ length: 130 }, (_, i) => game(100 + i, 'PS5', `k${i}`)))
    let result = await refreshScore(7, Date.now() + 10_000)
    expect(psnGameTrophies).toHaveBeenCalledTimes(100)
    expect(result.platforms.psn).toMatchObject({ read: 100, total: 130, state: 'reading' })

    ;(psnGameTrophies as jest.Mock).mockClear()
    ;(allowAttempt as jest.Mock).mockResolvedValueOnce(true).mockResolvedValue(false)
    result = await refreshScore(7, Date.now() + 10_000)
    expect(allowAttempt).toHaveBeenCalledWith('psn-score', 'app')
    expect(result.platforms.psn).toMatchObject({ state: 'reading', error: 'busy' })
    expect(result.complete).toBe(false)

    ;(allowAttempt as jest.Mock).mockResolvedValue(true)
    ;(psnGameTrophies as jest.Mock).mockClear().mockRejectedValue(new PsnError('too many requests'))
    result = await refreshScore(7, Date.now() + 10_000)
    // Two workers each hit the refusal once, then stop.
    expect((psnGameTrophies as jest.Mock).mock.calls.length).toBeLessThanOrEqual(2)
    expect(result.platforms.psn).toMatchObject({ error: 'busy' })
  })

  it('Steam reads eight games at once, never more', async () => {
    stored = []
    userRow = user({ steamid: 's1' })
    process.env.STEAM_API_KEY = 'key'
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { games: Array.from({ length: 20 }, (_, i) => ({ appid: i + 1, name: `G${i}`, playtime_forever: 5, rtime_last_played: 1_760_000_000 })) } })
    let inFlight = 0
    let peak = 0
    ;(fetchPlayerAchievements as jest.Mock).mockImplementation(async () => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await new Promise((r) => setTimeout(r, 5))
      inFlight--
      return [{ apiname: 'A', achieved: 1, unlocktime: 1_760_000_000 }]
    })
    const result = await refreshScore(7, Date.now() + 10_000)
    expect(peak).toBe(8)
    expect(result.platforms.steam).toEqual({ read: 20, total: 20, state: 'done' })
    delete process.env.STEAM_API_KEY
  })

  it('a game the platform will not answer for is skipped, and does not hold the fill up', async () => {
    stored = []
    userRow = user({ steamid: 's1' })
    process.env.STEAM_API_KEY = 'key'
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: { games: Array.from({ length: 6 }, (_, i) => ({ appid: i + 1, name: `G${i}`, playtime_forever: 5 })) } })
    ;(fetchPlayerAchievements as jest.Mock).mockImplementation(async (_auth: unknown, appId: number) => {
      if (appId === 2) throw Object.assign(new Error('Steam 500'), { status: 500 })
      return [{ apiname: 'A', achieved: 1, unlocktime: 1_760_000_000 }]
    })
    const result = await refreshScore(7, Date.now() + 10_000)
    expect(result.platforms.steam).toEqual({ read: 5, total: 6, skipped: 1, state: 'done' })
    expect(result.complete).toBe(true)

    // Every read failing is the platform down, not a few odd games.
    ;(fetchPlayerAchievements as jest.Mock).mockRejectedValue(Object.assign(new Error('Steam 500'), { status: 500 }))
    expect((await refreshScore(7, Date.now() + 10_000)).platforms.steam).toMatchObject({ state: 'error', error: 'unavailable' })
    delete process.env.STEAM_API_KEY
  })

  it('a Steam library that reads as empty is a private profile', async () => {
    userRow = user({ steamid: 's1' })
    process.env.STEAM_API_KEY = 'key'
    ;(getOwnedGames as jest.Mock).mockResolvedValue({ response: {} })
    expect((await refreshScore(7, Date.now() + 10_000)).platforms.steam).toEqual({ read: 0, total: 0, state: 'error', error: 'private' })
    delete process.env.STEAM_API_KEY
  })

  it('RA games are read straight from RA, one at a time', async () => {
    userRow = user({ rausername: 'ivan', raid: 'key' })
    ;(getUserCompletionProgress as jest.Mock).mockResolvedValue({
      Total: 1,
      Results: [{ GameID: 5, Title: 'Zelda', ConsoleName: 'NES', MaxPossible: 2, NumAwarded: 2, NumAwardedHardcore: 1, MostRecentAwardedDate: '2026-10-20' }],
    })
    ;(getGameInfoAndUserProgress as jest.Mock).mockResolvedValue({
      NumDistinctPlayers: 100,
      Achievements: {
        1: { Points: 10, NumAwarded: 80, DateEarnedHardcore: '2026-10-19 10:00:00', DateEarned: '2026-10-19 10:00:00' },
        2: { Points: 10, NumAwarded: 20, DateEarned: '2026-10-20 10:00:00' },
      },
    })
    stored = []
    await refreshScore(7, Date.now() + 10_000)
    expect(getGameInfoAndUserProgress).toHaveBeenCalledWith('ivan', 'key', 5)
    expect(writes).toEqual([expect.objectContaining({ game_id: 5, provisional: false, completed: false })])
  })
})

test('Xbox score reads at most two changed games per pass', () => {
  expect(PACE.xbox).toMatchObject({ concurrency: 1, perPass: 2 })
})

describe('classifyFailure', () => {
  it('tells what the user can fix from what to wait out', () => {
    expect(classifyFailure('ra', { status: 401 })).toBe('key')
    expect(classifyFailure('ra', { status: 429 })).toBe('busy')
    expect(classifyFailure('psn', new PsnError('privacy'))).toBe('private')
    expect(classifyFailure('xbox', new XboxError('rate-limited', 'quota'))).toBe('busy')
    expect(classifyFailure('xbox', new Error('down'))).toBe('unavailable')
  })
})

describe('passes and their status', () => {
  it('saves where the pass stands, the total, and marks the score fresh when complete', async () => {
    ;(readCache as jest.Mock).mockResolvedValue(null)
    const status = await runScorePass(7, 10_000)
    expect(status).toMatchObject({ complete: true, running: false, points: 1234, platforms: { psn: { state: 'done' } } })
    const saved = (writeCache as jest.Mock).mock.calls.map((c) => c[1])
    expect(saved[0]).toMatchObject({ running: true })
    expect(saved.at(-1)).toMatchObject({ running: false, complete: true })
    expect(query.mock.calls.some(([sql]) => sql === 'UPDATE users SET score_refreshed_at = now() WHERE id = $1')).toBe(true)
  })

  it('an unfinished pass leaves the row free for the next one', async () => {
    stored = []
    ;(readCache as jest.Mock).mockResolvedValue(null)
    await runScorePass(7, -1)
    expect(query.mock.calls.some(([sql]) => String(sql).includes('make_interval(hours => $2) + make_interval(mins => $3)'))).toBe(true)
  })

  it('continueFill answers a fresh, complete status without a pass, and never runs two at once', async () => {
    ;(readCache as jest.Mock).mockResolvedValue({ complete: true, running: false, points: 9, updatedAt: new Date().toISOString(), platforms: {} })
    await continueFill(7, 10_000)
    expect(psnTitles).not.toHaveBeenCalled()

    ;(readCache as jest.Mock).mockResolvedValue({ complete: false, running: true, points: 9, updatedAt: new Date().toISOString(), platforms: {} })
    query.mockImplementationOnce(async () => ({ rowCount: 0 }))
    expect(await continueFill(7, 10_000)).toMatchObject({ running: true })
    expect(psnTitles).not.toHaveBeenCalled()
  })

  it('a platform just linked says "calculating" at once', async () => {
    ;(readCache as jest.Mock).mockResolvedValue({ complete: true, running: false, points: 9, updatedAt: '2026-10-20T00:00:00Z', platforms: { ra: { read: 3, total: 3, state: 'done' } } })
    await onPlatformLinked(7, 'steam')
    expect((writeCache as jest.Mock).mock.calls[0][1]).toMatchObject({ complete: false, platforms: { ra: { state: 'done' }, steam: { state: 'reading' } } })
  })

  it('the heartbeat refreshes only a stale score, claiming it first', async () => {
    query.mockResolvedValueOnce({ rowCount: 0 })
    await refreshScoreIfStale(7)
    expect(query).toHaveBeenCalledTimes(1)
    expect(query.mock.calls[0][1]).toEqual([7, '6 hours'])
  })
})
