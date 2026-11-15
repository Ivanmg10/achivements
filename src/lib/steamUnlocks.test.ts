jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { forgetUnlocks, latestUnlocks, observePlaytime, playtimeChanges, recordUnlocks, storedUnlocks } from './steamUnlocks'
import { TWO_WEEKS_S } from '@/utils/steamMappers'

const query = pool.query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  query.mockResolvedValue({ rows: [] })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => { (console.error as jest.Mock).mockRestore() })

test('keeps only dated unlocks, in one insert', async () => {
  await recordUnlocks('7', '765', 620, [
    { apiname: 'A', achieved: 1, unlocktime: 1700000000 },
    { apiname: 'B', achieved: 0, unlocktime: 0 },
    { apiname: 'C', achieved: 1, unlocktime: 0 },
  ])
  expect(query).toHaveBeenCalledTimes(1)
  expect(query.mock.calls[0][0]).toContain('ON CONFLICT DO NOTHING')
  expect(query.mock.calls[0][1]).toEqual(['7', '765', 620, ['A'], [1700000000]])
})

test('nothing to keep, no query', async () => {
  await recordUnlocks('7', '765', 620, [{ apiname: 'B', achieved: 0, unlocktime: 0 }])
  expect(query).not.toHaveBeenCalled()
})

test('a failing write never fails the read it rides on', async () => {
  query.mockRejectedValue(new Error('no table'))
  await expect(recordUnlocks('7', '765', 620, [{ apiname: 'A', achieved: 1, unlocktime: 1 }])).resolves.toBeUndefined()
})

test('reads the kept unlocks of some games since a date', async () => {
  query.mockResolvedValue({ rows: [{ appid: 620, apiname: 'A', at: '1700000000' }] })
  expect(await storedUnlocks('7', '765', [620], 1600000000)).toEqual([{ appId: 620, apiname: 'A', unlocktime: 1700000000 }])
  expect(query.mock.calls[0][1]).toEqual(['7', '765', [620], 1600000000])
})

test('no games, or a failing read, is no unlocks', async () => {
  expect(await storedUnlocks('7', '765', [], 0)).toEqual([])
  expect(query).not.toHaveBeenCalled()
  query.mockRejectedValue(new Error('down'))
  expect(await storedUnlocks('7', '765', [1], 0)).toEqual([])
})

test('unlinking forgets them and the kept hours, each on its own', async () => {
  query.mockRejectedValueOnce(new Error('down'))
  await forgetUnlocks('7')
  expect(query).toHaveBeenCalledWith('DELETE FROM steam_unlocks WHERE user_id = $1', ['7'])
  expect(query).toHaveBeenCalledWith('DELETE FROM steam_playtime WHERE user_id = $1', ['7'])
})

test('the newest kept unlock of each game', async () => {
  query.mockResolvedValue({ rows: [{ appid: 620, at: '1700000000' }] })
  expect(await latestUnlocks('7', '765')).toEqual(new Map([[620, 1700000000]]))
  query.mockRejectedValue(new Error('down'))
  expect(await latestUnlocks('7', '765')).toEqual(new Map())
})

describe('playtimeChanges', () => {
  const now = 1_790_000_000_000
  const t = now / 1000
  const kept = new Map([
    [1, { appid: 1, minutes: 100, played: null }],
    [2, { appid: 2, minutes: 100, played: t - 999 }],
    [3, { appid: 3, minutes: 100, played: t - 999 }],
  ])

  test('a first sight is kept undated; a rise is dated; the same minutes write nothing', () => {
    expect(playtimeChanges(kept, [
      { appid: 9, playtime_forever: 40 },
      { appid: 1, playtime_forever: 130, playtime_2weeks: 30 },
      { appid: 2, playtime_forever: 100 },
      { appid: 3, playtime_forever: 160 },
    ], now)).toEqual([
      { appid: 9, minutes: 40, played: null },
      { appid: 1, minutes: 130, played: t },
      // Played since, but not in the last two weeks: at most two weeks ago.
      { appid: 3, minutes: 160, played: t - TWO_WEEKS_S },
    ])
  })

  test('fewer minutes keep the date', () => {
    expect(playtimeChanges(kept, [{ appid: 2, playtime_forever: 60 }], now)).toEqual([{ appid: 2, minutes: 60, played: t - 999 }])
  })
})

test('observes the hours in one read and one write, and answers the dated games', async () => {
  query.mockResolvedValueOnce({ rows: [{ appid: 1, minutes: 100, played: '1700000000' }, { appid: 2, minutes: 5, played: null }] })
  const seen = await observePlaytime('7', '765', [{ appid: 1, playtime_forever: 100 }, { appid: 2, playtime_forever: 9, playtime_2weeks: 4 }], 1_790_000_000_000)
  expect(seen).toEqual(new Map([[1, 1700000000], [2, 1_790_000_000]]))
  expect(query).toHaveBeenCalledTimes(2)
  expect(query.mock.calls[1][1]).toEqual(['7', '765', [2], [9], [1_790_000_000]])
})

test('nothing changed, nothing written; no games, no query; no table, no dates', async () => {
  query.mockResolvedValueOnce({ rows: [{ appid: 1, minutes: 100, played: null }] })
  expect(await observePlaytime('7', '765', [{ appid: 1, playtime_forever: 100 }])).toEqual(new Map())
  expect(query).toHaveBeenCalledTimes(1)
  query.mockClear()
  expect(await observePlaytime('7', '765', [])).toEqual(new Map())
  expect(query).not.toHaveBeenCalled()
  query.mockRejectedValue(new Error('relation "steam_playtime" does not exist'))
  expect(await observePlaytime('7', '765', [{ appid: 1, playtime_forever: 100 }])).toEqual(new Map())
  expect(console.error).toHaveBeenCalled()
})
