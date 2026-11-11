import { formatDate, localDay, parseUnlockTime, unlockIso, utcDay } from './dates'

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
  test('in the reader’s language', () => {
    const en = formatDate('2026-10-03 12:00:00', 'en')
    const es = formatDate('2026-10-03 12:00:00', 'es')
    expect(en).toBe('Oct 3, 2026')
    expect(es).not.toBe(en)
    expect(es).toContain('2026')
  })

  test('takes other options, and says "—" for nothing', () => {
    expect(formatDate('2026-10-03', 'en', { year: 'numeric' })).toBe('2026')
    expect(formatDate(null, 'en')).toBe('—')
    expect(formatDate('nope', 'es')).toBe('—')
  })
})
