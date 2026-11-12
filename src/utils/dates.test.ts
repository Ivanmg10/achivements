import { addDays, dateFormat, formatDate, formatDateTime, formatDay, localDay, parseUnlockTime, relativeTime, unlockIso, utcDay } from './dates'

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

describe('unlockIso', () => {
  test('an RA date is the same moment in ISO; nothing is null', () => {
    expect(unlockIso('2026-10-17 18:30:00')).toBe('2026-10-17T18:30:00.000Z')
    expect(unlockIso('2026-10-17T20:30:00+02:00')).toBe('2026-10-17T18:30:00.000Z')
    expect(unlockIso(undefined)).toBeNull()
    expect(unlockIso('nope')).toBeNull()
  })
})

describe('utcDay and localDay', () => {
  test('the UTC day key, from a Date or a timestamp', () => {
    expect(utcDay(Date.UTC(2026, 9, 17, 23, 59))).toBe('2026-10-17')
    expect(utcDay(new Date(Date.UTC(2026, 0, 1)))).toBe('2026-01-01')
  })

  test('the local day, padded', () => {
    expect(localDay(new Date(2026, 2, 5, 23, 0))).toBe('2026-03-05')
  })
})

describe('formatDate', () => {
  // The year only when it is not this one: the clock is pinned, so the tests say the same every year.
  beforeEach(() => jest.useFakeTimers({ now: Date.parse('2026-11-11T12:00:00Z') }))
  afterEach(() => jest.useRealTimers())

  test('day and short month in the reader’s language, no year this year', () => {
    expect(formatDate('2026-10-03 12:00:00', 'en')).toBe('Oct 3')
    expect(formatDate('2026-10-03 12:00:00', 'es')).toBe('3 oct')
  })

  test('the year when it is another one', () => {
    expect(formatDate('2025-10-03 12:00:00', 'en')).toBe('Oct 3, 2025')
    expect(formatDate('2027-01-01', 'es')).toBe('1 ene 2027')
  })

  test('a moment in ms, a calendar day, and the options of a date that is not one of something', () => {
    expect(formatDate(Date.parse('2025-02-01T12:00:00Z'), 'en')).toBe('Feb 1, 2025')
    expect(formatDay('2026-06-05', 'en')).toBe('Jun 5')
    expect(formatDay('2024-06-05', 'en')).toBe('Jun 5, 2024')
    expect(formatDate('2026-10-03', 'en', { year: 'numeric' })).toBe('2026')
    expect(dateFormat(new Date(2026, 0, 1), new Date(2026, 11, 31))).toEqual({ day: 'numeric', month: 'short' })
  })

  test('with its time, where the time is the point: the same format, then hh:mm', () => {
    expect(formatDateTime('2026-10-03T09:05:00Z', 'en')).toMatch(/^Oct 3, \d\d:\d\d [AP]M$/)
    expect(formatDateTime('2025-10-03T09:05:00Z', 'es')).toMatch(/^3 oct 2025, \d\d:\d\d$/)
    expect(formatDateTime(null, 'en')).toBe('—')
  })

  test('"—" for nothing', () => {
    expect(formatDate(null, 'en')).toBe('—')
    expect(formatDate('nope', 'es')).toBe('—')
  })
})

describe('relativeTime', () => {
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString()
  test('short by default, whole words on request ("6 m" could be minutes)', () => {
    const t = ago(6 * 31 * 86400e3)
    expect(relativeTime(t, 'en')).toBe('6 mo. ago')
    expect(relativeTime(t, 'en', 'long')).toBe('6 months ago')
    expect(relativeTime(t, 'es', 'long')).toBe('hace 6 meses')
  })
  test('no date, no time', () => {
    expect(relativeTime(null)).toBe('—')
  })
})

describe('addDays', () => {
  test('moves across months and years, both ways', () => {
    expect(addDays('2026-06-29', 3)).toBe('2026-07-02')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('2026-03-10', 0)).toBe('2026-03-10')
  })
})
