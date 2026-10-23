jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'
import { forgetUnlocks, recordUnlocks, storedUnlocks } from './steamUnlocks'

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

test('unlinking forgets them', async () => {
  await forgetUnlocks('7')
  expect(query).toHaveBeenCalledWith('DELETE FROM steam_unlocks WHERE user_id = $1', ['7'])
})
