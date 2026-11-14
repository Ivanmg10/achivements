import { psnCallsPerMinute, psnCallTotals, recordPsnCall, resetPsnCallStats } from './psnCallStats'

const MIN = 60_000
const T0 = Date.UTC(2026, 10, 14, 12, 0, 5)

beforeEach(() => {
  resetPsnCallStats()
  jest.spyOn(console, 'info').mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())

test('calls are counted per function, in the total and in their minute', () => {
  recordPsnCall('titles', T0)
  recordPsnCall('sets', T0 + 1000)
  recordPsnCall('sets', T0 + 2000)
  recordPsnCall('sets', T0 + MIN)
  expect(psnCallTotals()).toEqual({ titles: 1, sets: 3 })
  const [first, second] = psnCallsPerMinute()
  expect(first).toMatchObject({ minute: '2026-11-14T12:00:00.000Z', calls: 3, counts: { titles: 1, sets: 2 } })
  expect(second).toMatchObject({ minute: '2026-11-14T12:01:00.000Z', calls: 1, counts: { sets: 1 } })
})

test('a minute that ended is logged once, with names and counts only', () => {
  const info = console.info as jest.Mock
  recordPsnCall('titles', T0)
  recordPsnCall('titles', T0 + 1000)
  expect(info).not.toHaveBeenCalled()
  recordPsnCall('summary', T0 + MIN)
  expect(info).toHaveBeenCalledTimes(1)
  expect(info).toHaveBeenCalledWith('[psn] calls in the minute', '2026-11-14T12:00:00.000Z', 2, '{"titles":2}')
})

test('only the last hour is kept, the totals keep everything', () => {
  for (let i = 0; i < 70; i++) recordPsnCall('played', T0 + i * MIN)
  expect(psnCallsPerMinute()).toHaveLength(60)
  expect(psnCallTotals()).toEqual({ played: 70 })
})
