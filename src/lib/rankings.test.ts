jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { loadRanking, rankEntries, takeWeeklySnapshot, vaultTotals, vaultTotalsOrNone, weekStartRanks } from './rankings'

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
    expect(periodCall[1]).toEqual(['w', '2026-10-19', false])
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
