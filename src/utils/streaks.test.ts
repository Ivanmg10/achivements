import { activeStreak, calcAllStreaks, streakSummary } from './streaks'
import type { RecentAchievement } from '@/types/types'

const at = (Date: string) => ({ Date, GameID: 1 }) as RecentAchievement

test('runs of consecutive days, the longest first, each with its unlocks', () => {
  const list = [at('2026-11-01 10:00:00'), at('2026-11-02 10:00:00'), at('2026-11-02 11:00:00'), at('2026-11-05 10:00:00')]
  const streaks = calcAllStreaks(list, 'UTC')
  expect(streaks.map(({ start, end, days }) => ({ start, end, days }))).toEqual([
    { start: '2026-11-01', end: '2026-11-02', days: 2 },
    { start: '2026-11-05', end: '2026-11-05', days: 1 },
  ])
  expect(streaks[0].achievements).toHaveLength(3)
  expect(calcAllStreaks([], 'UTC')).toEqual([])
  expect(calcAllStreaks([at('nope')], 'UTC')).toEqual([])
})

test('crosses the end of a month and a clock change', () => {
  const list = ['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-31', '2026-11-01'].map((d) => at(`${d} 12:00:00`))
  expect(calcAllStreaks(list, 'Europe/Madrid').map((s) => s.days)).toEqual([3, 2])
})

describe('the days are the person’s calendar (the owner’s report, 2026-11-19)', () => {
  // 00:50 on Nov 19 in Madrid is 23:50 UTC on Nov 18.
  const list = [at('2026-11-17 12:00:00'), at('2026-11-18 12:00:00'), at('2026-11-18 23:50:00')]
  const now = Date.parse('2026-11-19T09:00:00Z')

  test('Madrid: the late unlock is Nov 19, and the streak reaches today', () => {
    expect(streakSummary(list, now, 'Europe/Madrid').active).toEqual({ start: '2026-11-17', end: '2026-11-19', days: 3 })
  })

  test('UTC: the same unlock is Nov 18', () => {
    expect(streakSummary(list, now, 'UTC').active).toEqual({ start: '2026-11-17', end: '2026-11-18', days: 2 })
  })

  test('New York (behind UTC): 03:30 UTC on Nov 19 is still Nov 18 there', () => {
    const ny = [at('2026-11-17 15:00:00'), at('2026-11-19 03:30:00')]
    expect(calcAllStreaks(ny, 'America/New_York').map((s) => [s.start, s.end])).toEqual([['2026-11-17', '2026-11-18']])
    expect(calcAllStreaks(ny, 'UTC').map((s) => s.days)).toEqual([1, 1])
  })

  test('without a zone, the browser’s own (built from a local time, as jest cannot switch zones)', () => {
    const sent = (y: number, m: number, d: number, h: number, min: number) =>
      new Date(y, m, d, h, min).toISOString().slice(0, 19).replace('T', ' ')
    const streaks = calcAllStreaks([at(sent(2026, 10, 18, 12, 0)), at(sent(2026, 10, 19, 0, 50))])
    expect(streaks.map((s) => [s.start, s.end])).toEqual([['2026-11-18', '2026-11-19']])
  })
})

test('a streak is alive while it ended today or yesterday, on the same calendar', () => {
  const streaks = [{ end: '2026-11-18' }]
  // 00:30 on Nov 20 in Madrid is 23:30 UTC on Nov 19: Madrid's yesterday is Nov 19, so Nov 18 is gone.
  const lateNight = Date.parse('2026-11-19T23:30:00Z')
  expect(activeStreak(streaks, lateNight, 'UTC')).toEqual({ end: '2026-11-18' })
  expect(activeStreak(streaks, lateNight, 'Europe/Madrid')).toBeNull()
  expect(activeStreak([{ end: '2026-12-31' }], Date.parse('2027-01-01T10:00:00Z'), 'UTC')).toEqual({ end: '2026-12-31' })
})
