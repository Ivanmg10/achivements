import { SAMPLE_STREAKS, streaksEndingOn } from './landingSamples'

test('the example streaks move so the one going on ends today, each keeping its length', () => {
  const moved = streaksEndingOn('2027-01-10')
  expect(moved[0].end).toBe('2027-01-10')
  expect(moved[0].start).toBe('2026-11-16')
  expect(moved.map((s) => s.days)).toEqual(SAMPLE_STREAKS.map((s) => s.days))
  expect(streaksEndingOn(SAMPLE_STREAKS[0].end)).toEqual(SAMPLE_STREAKS)
})
