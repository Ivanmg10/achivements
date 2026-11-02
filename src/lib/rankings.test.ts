jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))
jest.mock('@/lib/steamCache', () => ({ readCache: jest.fn(async () => 0), writeCache: jest.fn() }))

import pool from '@/lib/db'
import { loadRanking, profileTeaser, rankByStreak, rankEntries, streakOf, streaksOf, takeWeeklySnapshot, vaultTotals, vaultTotalsOrNone, weekStartRanks, type RankEntry } from './rankings'
import { readCache } from '@/lib/steamCache'

const query = pool.query as jest.Mock

const row = (id: number, username: string, source: 'ra' | 'steam' | 'psn' | 'xbox', points: number, extra: Partial<{ listed: boolean; completed: number; achievements: number }> = {}) => ({
  id, username, avatar: null, listed: true, source, points, completed: 0, achievements: 0, ...extra,
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('rankEntries', () => {
  it('adds up platforms, orders by points and shares a place on a tie', () => {
    const list = rankEntries([row(1, 'ana', 'ra', 500), row(1, 'ana', 'psn', 500.4), row(2, 'bo', 'steam', 1000), row(3, 'cy', 'psn', 300)], null, 'all')
    expect(list.map((e) => [e.username, e.points, e.rank])).toEqual([['ana', 1000, 1], ['bo', 1000, 1], ['cy', 300, 3]])
    expect(list[0].split).toEqual({ ra: 500, psn: 500 })
  })

  it('ranks one platform, keeping the all-time total for the level', () => {
    const [first] = rankEntries([row(1, 'ana', 'ra', 900), row(1, 'ana', 'psn', 100), row(2, 'bo', 'psn', 400)], null, 'psn')
    expect(first).toMatchObject({ username: 'bo', points: 400, totalPoints: 400 })
    expect(rankEntries([row(1, 'ana', 'ra', 900), row(1, 'ana', 'psn', 100)], null, 'psn')[0].totalPoints).toBe(1000)
  })

  it('ranks a period by what was earned in it, leaving out who earned nothing', () => {
    const list = rankEntries([row(1, 'ana', 'ra', 900), row(2, 'bo', 'psn', 100)], [{ id: 2, source: 'psn', points: 40 }], 'all')
    expect(list.map((e) => [e.username, e.points])).toEqual([['bo', 40]])
  })

  it('tells an unlisted user where they would stand, without taking a place', () => {
    const list = rankEntries([row(1, 'ana', 'ra', 900), row(2, 'me', 'ra', 500, { listed: false }), row(3, 'cy', 'ra', 100)], null, 'all')
    expect(list.map((e) => [e.username, e.rank, e.listed])).toEqual([['ana', 1, true], ['cy', 2, true], ['me', 2, false]])
  })
})

describe('streaks', () => {
  it('counts the run up to today or yesterday, and the longest one', () => {
    expect(streakOf([1, 2, 3, 7, 8], 9)).toEqual({ current: 2, best: 3 })
    expect(streakOf([1, 2, 3, 7, 8], 8)).toEqual({ current: 2, best: 3 })
    // Nothing yesterday or today: the run is over.
    expect(streakOf([1, 2, 3], 5)).toEqual({ current: 0, best: 3 })
    expect(streakOf([], 5)).toEqual({ current: 0, best: 0 })
  })

  it('reads UTC days from the stored unlocks, only linked accounts and unflagged games', async () => {
    query.mockResolvedValue({ rows: [{ id: 4, days: [20381, 20382] }] })
    const map = await streaksOf([4], 'psn', false, new Date('2025-10-21T12:00:00Z'))
    expect(map.get(4)).toEqual({ current: 2, best: 2 })
    const [sql, params] = query.mock.calls[0]
    expect(sql).toContain("g.flag IS DISTINCT FROM 'suspect'")
    expect(sql).toContain("WHEN 'psn' THEN u.psnaccountid")
    expect(params).toEqual([[4], 'psn', false])
    query.mockClear()
    expect((await streaksOf([], 'all', false)).size).toBe(0)
    expect(query).not.toHaveBeenCalled()
  })

  it('ranks by a streak, sharing a place on a tie, leaving out who has none', () => {
    const e = (id: number, points: number, listed = true) => ({ id, username: `u${id}`, avatar: null, points, totalPoints: points, split: {}, completed: 0, achievements: 0, rank: 0, listed }) as RankEntry
    const streaks = new Map([[1, { current: 3, best: 9 }], [2, { current: 3, best: 4 }], [4, { current: 5, best: 5 }]])
    const list = rankByStreak([e(1, 100), e(2, 500), e(3, 900), e(4, 50, false)], streaks, 'current')
    expect(list.map((x) => [x.username, x.rank])).toEqual([['u2', 1], ['u1', 1], ['u4', 1]])
    expect(rankByStreak([e(1, 100), e(2, 500)], streaks, 'best').map((x) => x.username)).toEqual(['u1', 'u2'])
  })
})

describe('loadRanking', () => {
  it('reads only linked accounts, unflagged games, and Xbox for admins', async () => {
    query.mockResolvedValue({ rows: [] })
    await loadRanking({ scope: 'following', period: 'all', source: 'all', viewerId: 3, xbox: false })
    const [sql, params] = query.mock.calls[0]
    expect(sql).toContain("g.flag IS DISTINCT FROM 'suspect'")
    expect(sql).toContain('WHEN \'psn\' THEN u.psnaccountid')
    expect(sql).toContain('u.profile_public AND u.show_in_rankings')
    expect(sql).toContain('follower_id = $2')
    expect(params).toEqual([false, 3])
  })

  it('places a viewer who is not listed after the global list', async () => {
    query
      .mockResolvedValueOnce({ rows: [row(1, 'ana', 'ra', 900)] })
      .mockResolvedValueOnce({ rows: [row(9, 'me', 'steam', 950, { listed: false })] })
    const list = await loadRanking({ scope: 'global', period: 'all', source: 'steam', viewerId: 9, xbox: false, now: new Date('2030-01-01') })
    expect(list.map((e) => [e.username, e.rank, e.listed])).toEqual([['me', 1, false]])
  })

  it('ranks the week from score_periods', async () => {
    query.mockImplementation(async (sql: string) =>
      sql.includes('score_periods') ? { rows: [{ id: 1, source: 'ra', points: 70 }] } : { rows: [row(1, 'ana', 'ra', 900)] },
    )
    const list = await loadRanking({ scope: 'following', period: 'week', source: 'all', viewerId: 1, xbox: false, now: new Date('2026-10-21T00:00:00Z') })
    expect(list[0].points).toBe(70)
    const periodCall = query.mock.calls.find(([sql]) => sql.includes('score_periods'))!
    expect(periodCall[1]).toEqual(['w', '2026-10-19', false, null])
  })
})

describe('hidden score projections', () => {
  it('excludes hidden games from rankings, streaks, totals and public teasers', async () => {
    query.mockResolvedValue({ rows: [] })
    await loadRanking({ scope: 'following', period: 'all', source: 'all', viewerId: 3, xbox: false })
    await streaksOf([3], 'all', false)
    await vaultTotals([3], false)
    await profileTeaser('ana')

    for (const [sql] of query.mock.calls) expect(sql).toContain('hidden_games')
  })
})

describe('loadRanking, global', () => {
  it('keeps everyone else cached a few minutes, but reads the viewer anew every time', async () => {
    query
      .mockResolvedValueOnce({ rows: [row(1, 'ana', 'ra', 900), row(7, 'me', 'psn', 100)] })
      .mockResolvedValueOnce({ rows: [row(7, 'me', 'psn', 100)] })
      .mockResolvedValueOnce({ rows: [row(7, 'me', 'psn', 100), row(7, 'me', 'steam', 900)] })
    const opts = { scope: 'global' as const, period: 'all' as const, source: 'all' as const, viewerId: 7, xbox: true, now: new Date('2031-01-01') }
    expect((await loadRanking(opts)).find((e) => e.id === 7)?.points).toBe(100)
    // Steam landed since: the global list comes from the cache, the viewer's row from the database.
    const again = await loadRanking(opts)
    expect(query).toHaveBeenCalledTimes(3)
    expect(again.map((e) => [e.username, e.points, e.rank])).toEqual([['me', 1000, 1], ['ana', 900, 2]])
  })
})

describe('loadRanking, shared visibility revision', () => {
  it('a new revision bypasses the warm global cache in another instance', async () => {
    ;(readCache as jest.Mock).mockResolvedValueOnce('1').mockResolvedValueOnce('2')
    query.mockResolvedValue({ rows: [] })
    const opts = { scope: 'global' as const, period: 'all' as const, source: 'all' as const, viewerId: null, xbox: false }

    await loadRanking(opts)
    await loadRanking(opts)
    expect(query).toHaveBeenCalledTimes(2)
  })
})

describe('snapshots', () => {
  it('takes one a week, of listed users', async () => {
    query
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rows: [row(1, 'ana', 'ra', 900), row(2, 'bo', 'ra', 300)] })
      .mockResolvedValue({ rowCount: 1 })
    expect(await takeWeeklySnapshot(new Date('2026-10-21T00:00:00Z'))).toBe(true)
    const insert = query.mock.calls[2]
    expect(insert[0]).toContain('INSERT INTO score_snapshots')
    expect(JSON.parse(insert[1][1])).toEqual([{ id: 1, rank: 1, points: 900 }, { id: 2, rank: 2, points: 300 }])
  })

  it('does nothing when this week has one', async () => {
    query.mockResolvedValueOnce({ rowCount: 1 })
    expect(await takeWeeklySnapshot()).toBe(false)
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('reads where everyone stood on Monday', async () => {
    query.mockResolvedValue({ rows: [{ user_id: 4, rank: 7 }] })
    expect(await weekStartRanks(new Date('2026-10-21T00:00:00Z'))).toEqual(new Map([[4, 7]]))
  })
})

describe('vaultTotals', () => {
  it('sums each user, rounded', async () => {
    query.mockResolvedValue({ rows: [{ id: 4, points: 10.6 }] })
    expect(await vaultTotals([4], false)).toEqual(new Map([[4, 11]]))
    expect(await vaultTotals([], false)).toEqual(new Map())
  })

  it('leaves the points out when they cannot be read', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    query.mockRejectedValue(new Error('no table'))
    expect(await vaultTotalsOrNone([4], false)).toEqual(new Map())
  })
})

describe('profileTeaser', () => {
  it('adds up the platforms of a listed user', async () => {
    query.mockResolvedValue({ rows: [
      { username: 'Ana', avatar: null, source: 'ra', points: 100.4, completed: 2, achievements: 50 },
      { username: 'Ana', avatar: null, source: 'psn', points: 20.4, completed: 1, achievements: 10 },
    ] })
    expect(await profileTeaser('ana')).toEqual({ username: 'Ana', avatar: null, points: 121, split: { ra: 100, psn: 20 }, completed: 3, achievements: 60 })
    expect(query.mock.calls[0][0]).toContain('u.profile_public AND u.show_in_rankings')
  })

  it('shows a listed user with no points yet at zero', async () => {
    query.mockResolvedValue({ rows: [{ username: 'Ana', avatar: null, source: null, points: null, completed: 0, achievements: 0 }] })
    expect(await profileTeaser('ana')).toEqual({ username: 'Ana', avatar: null, points: 0, split: {}, completed: 0, achievements: 0 })
  })

  it('leaves out an uploaded picture, which a visitor without an account cannot load', async () => {
    query.mockResolvedValue({ rows: [{ username: 'Ana', avatar: '/api/avatar/3-1', source: null, points: null, completed: 0, achievements: 0 }] })
    expect((await profileTeaser('ana'))?.avatar).toBeNull()
  })

  it('is null for a private, opted-out or missing user', async () => {
    query.mockResolvedValue({ rows: [] })
    expect(await profileTeaser('ghost')).toBeNull()
  })
})
