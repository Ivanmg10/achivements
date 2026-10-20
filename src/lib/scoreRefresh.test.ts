jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn(), connect: jest.fn() } }))
jest.mock('@/lib/raClient', () => ({ getGameInfoAndUserProgress: jest.fn(), getUserCompletionProgress: jest.fn() }))
jest.mock('@/lib/steamClient', () => ({ getOwnedGames: jest.fn() }))
jest.mock('@/lib/steamCache', () => ({ withSteamCache: jest.fn((_k: string, _t: number, f: () => unknown) => f()) }))
jest.mock('@/lib/steamProgress', () => ({ fetchPlayerAchievements: jest.fn(), isNoStats: () => false, loadGlobalPct: jest.fn() }))
jest.mock('@/lib/psnClient', () => ({ psnTitles: jest.fn(), psnGameTrophies: jest.fn() }))
jest.mock('@/lib/xboxClient', () => ({ xboxLibrary: jest.fn(), xboxGameAchievements: jest.fn() }))

import pool from '@/lib/db'
import { psnGameTrophies, psnTitles } from '@/lib/psnClient'
import { getGameInfoAndUserProgress, getUserCompletionProgress } from '@/lib/raClient'
import { RULES_VERSION } from '@/utils/vaultScore'
import { refreshScore, refreshScoreIfStale } from './scoreRefresh'

const query = pool.query as jest.Mock
const client = { query: jest.fn(), release: jest.fn() }

const counts = (b: number, g = 0, p = 0) => ({ bronze: b, silver: 0, gold: g, platinum: p })
const game = (id: number, consoleName: string, lastTrophyAt: string) => ({
  id, title: `Game ${id}`, consoleName, lastTrophyAt, earned: counts(2), defined: counts(4), titleId: `NPWR${id}`, service: 'trophy2',
})
const trophy = (earned: boolean, rarity: number) => ({ id: 1, name: '', detail: '', iconUrl: null, type: 'bronze', groupId: 'default', hidden: false, earned, earnedAt: earned ? '2026-10-20T10:00:00Z' : null, rarity })

let stored: Record<string, unknown>[]
let writes: { game_id: number; provisional: boolean; points: number }[]
let kept: number[] | null

beforeEach(() => {
  jest.clearAllMocks()
  stored = [
    { game_id: '2', account: 'acc', title: 'Game 2', points: 300, change_key: 'k2', rules_version: RULES_VERSION, provisional: false, flag: null },
    { game_id: '9', account: 'acc', title: 'Gone', points: 100, change_key: 'k9', rules_version: RULES_VERSION, provisional: false, flag: null },
  ]
  writes = []
  kept = null
  ;(pool.connect as jest.Mock).mockResolvedValue(client)
  client.query.mockResolvedValue({ rows: [] })
  query.mockImplementation(async (sql: string, params: unknown[]) => {
    if (sql.includes('FROM users WHERE id')) {
      return { rows: [{ id: 7, rausername: null, raid: null, steamid: null, psnaccountid: 'acc', xboxxuid: null, preferences: { 'hidden-consoles:psn': '["PS3"]' } }] }
    }
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
    if (sql.includes('SELECT game_id, title, points')) return { rows: [{ game_id: '1', title: 'Game 1', points: 500 }, { game_id: '2', title: 'Game 2', points: 300 }] }
    return { rows: [], rowCount: 0 }
  })
  ;(psnTitles as jest.Mock).mockResolvedValue([game(1, 'PS5', 'k1-new'), { ...game(2, 'PS4', 'k2') }, game(3, 'PS5', 'k3'), game(4, 'PS3', 'k4')])
  ;(psnGameTrophies as jest.Mock).mockResolvedValue([trophy(true, 60), trophy(true, 30), trophy(false, 5), trophy(false, 2), trophy(false, 1)])
})

test('reads only what moved, leaves out hidden games and consoles, and drops what left', async () => {
  expect(await refreshScore(7, Date.now() + 10_000)).toBe(true)
  // Game 1 moved; game 2 is as it was scored; 3 is hidden, 4 is on an unticked console.
  expect(psnGameTrophies).toHaveBeenCalledTimes(1)
  expect(writes.map((w) => [w.game_id, w.provisional])).toEqual([[1, false]])
  expect(writes[0].points).toBeGreaterThan(0)
  expect([...(kept ?? [])].sort()).toEqual([1, 2])
  // Weeks and months are rebuilt in one transaction.
  expect(client.query).toHaveBeenCalledWith('BEGIN')
  expect(client.query).toHaveBeenCalledWith('COMMIT')
})

test('out of time, a moved game stands in from the list and the fill is unfinished', async () => {
  stored = []
  expect(await refreshScore(7, Date.now() - 1)).toBe(false)
  expect(psnGameTrophies).not.toHaveBeenCalled()
  expect(writes.map((w) => [w.game_id, w.provisional]).sort()).toEqual([[1, true], [2, true]])
})

test('a platform that cannot be listed keeps its scores', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(psnTitles as jest.Mock).mockRejectedValue(new Error('private'))
  expect(await refreshScore(7, Date.now() + 10_000)).toBe(false)
  expect(writes).toEqual([])
  expect(kept).toBeNull()
})

test('RA games are read straight from RA, softcore at half', async () => {
  query.mockImplementation(async (sql: string, params: unknown[]) => {
    if (sql.includes('FROM users WHERE id')) return { rows: [{ id: 7, rausername: 'ivan', raid: 'key', steamid: null, psnaccountid: null, xboxxuid: null, preferences: {} }] }
    if (sql.includes('INSERT INTO score_games')) {
      writes = JSON.parse(params[4] as string)
      return {}
    }
    return { rows: [] }
  })
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
  await refreshScore(7, Date.now() + 10_000)
  expect(getGameInfoAndUserProgress).toHaveBeenCalledWith('ivan', 'key', 5)
  expect(writes).toEqual([expect.objectContaining({ game_id: 5, provisional: false, completed: false })])
})

test('refreshes only a stale score, claiming it first', async () => {
  query.mockResolvedValueOnce({ rowCount: 0 })
  await refreshScoreIfStale(7)
  expect(query).toHaveBeenCalledTimes(1)
  expect(query.mock.calls[0][0]).toContain('score_refreshed_at < now()')
})
