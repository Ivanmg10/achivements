import { countByDay, streakInsights } from './utils'

test('active days, average streak, days since the last, longest gap and weekdays', () => {
  const byDay = countByDay([
    { Date: '2026-06-01 10:00:00' }, { Date: '2026-06-01 11:00:00' }, // Monday ×2
    { Date: '2026-06-02 10:00:00' },                                  // Tuesday
    { Date: '2026-06-07 10:00:00' },                                  // Sunday, after a 4-day gap
  ] as never)
  const r = streakInsights(byDay, [{ days: 2 }, { days: 1 }], '2026-06-10')
  expect(r.activeDays).toBe(3)
  expect(r.avgStreak).toBe(1.5)
  expect(r.daysSinceLast).toBe(3)
  expect(r.longestGap).toBe(4)
  expect(r.weekdays).toEqual([2, 1, 0, 0, 0, 0, 1])
})

test('nothing played: no last day', () => {
  expect(streakInsights({}, [], '2026-06-10').daysSinceLast).toBeNull()
})
