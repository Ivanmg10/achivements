import { parseUnlockTime } from './dates'

describe('parseUnlockTime', () => {
  test('a zone-less platform date is UTC, whatever the browser zone is', () => {
    expect(parseUnlockTime('2026-10-17 18:30:00')).toBe(Date.UTC(2026, 9, 17, 18, 30, 0))
    expect(parseUnlockTime('2026-10-17T18:30:00')).toBe(Date.UTC(2026, 9, 17, 18, 30, 0))
  })

  test('a date that carries its zone is read as it says', () => {
    expect(parseUnlockTime('2026-10-17T18:30:00Z')).toBe(Date.UTC(2026, 9, 17, 18, 30, 0))
    expect(parseUnlockTime('2026-10-17T20:30:00+02:00')).toBe(Date.UTC(2026, 9, 17, 18, 30, 0))
    expect(parseUnlockTime('2026-10-17T18:30:00.000Z')).toBe(Date.UTC(2026, 9, 17, 18, 30, 0))
  })

  test('nothing or garbage is NaN', () => {
    expect(parseUnlockTime(null)).toBeNaN()
    expect(parseUnlockTime('')).toBeNaN()
    expect(parseUnlockTime('nope')).toBeNaN()
  })
})
