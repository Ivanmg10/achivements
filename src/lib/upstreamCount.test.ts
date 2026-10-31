jest.mock('@/lib/db', () => ({ __esModule: true, default: { query: jest.fn() } }))

import pool from '@/lib/db'

const query = pool.query as jest.Mock

async function fresh() {
  jest.resetModules()
  return import('./upstreamCount')
}

beforeEach(() => {
  query.mockReset()
  query.mockResolvedValue({ rows: [] })
})

test('calls are written in batches, added to what is stored', async () => {
  const { countUpstream } = await fresh()
  const db = (await import('@/lib/db')).default.query as jest.Mock
  db.mockReset()
  db.mockResolvedValue({ rows: [] })
  for (let i = 0; i < 49; i++) countUpstream('steam')
  await new Promise((r) => setTimeout(r, 0))
  expect(db).not.toHaveBeenCalled()
  countUpstream('steam')
  await new Promise((r) => setTimeout(r, 20))
  expect(db).toHaveBeenCalledTimes(1)
  expect(db.mock.calls[0][0]).toContain('ON CONFLICT')
  expect(db.mock.calls[0][1][1]).toBe(50)
})

test('a count that cannot be read is zero, not a failure', async () => {
  const { upstreamCalls } = await fresh()
  const db = (await import('@/lib/db')).default.query as jest.Mock
  db.mockRejectedValue(new Error('down'))
  jest.spyOn(console, 'error').mockImplementation(() => {})
  await expect(upstreamCalls('ra')).resolves.toBe(0)
})

test('fills wait as Steam nears its daily cap, with one warning on the way', async () => {
  const { steamBudgetLow } = await fresh()
  const db = (await import('@/lib/db')).default.query as jest.Mock
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
  db.mockResolvedValue({ rows: [{ calls: 71_000 }] })
  expect(await steamBudgetLow(100_000)).toBe(false)
  expect(warn).toHaveBeenCalledTimes(1)
  db.mockResolvedValue({ rows: [{ calls: 86_000 }] })
  expect(await steamBudgetLow(200_000)).toBe(true)
  expect(warn).toHaveBeenCalledTimes(1)
})
