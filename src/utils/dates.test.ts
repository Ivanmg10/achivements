import { addDays, dateFormat, formatDate, formatDateTime, formatDay, formatWeekdayDay, upperFirst, localDay, parseUnlockTime, relativeTime, unlockIso, utcDay, weekDays, mondayOf, dayIn, unlockDay, isTimeZone } from './dates'

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

describe('weekDays and mondayOf', () => {
  const OLD_TZ = process.env.TZ
  afterEach(() => { process.env.TZ = OLD_TZ })

  test('the seven days from a Monday, whatever the browser zone is', () => {
    for (const tz of ['UTC', 'Europe/Madrid', 'America/Los_Angeles', 'Pacific/Auckland']) {
      process.env.TZ = tz
      expect(weekDays('2026-10-05')).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'])
      expect(mondayOf('2026-10-11')).toBe('2026-10-05')
      expect(mondayOf('2026-10-05')).toBe('2026-10-05')
    }
  })

  test('crosses a month, a year and a clock change', () => {
    expect(weekDays('2026-12-28')).toEqual(['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03'])
    process.env.TZ = 'Europe/Madrid'
    expect(weekDays('2026-10-19').at(-1)).toBe('2026-10-25')
    expect(mondayOf('2026-10-25')).toBe('2026-10-19')
  })
})

describe('dayIn and unlockDay: a person’s own calendar (2026-11-19)', () => {
  // The owner's report: 00:50 on Nov 19 in Madrid is 23:50 UTC on Nov 18.
  const UNLOCK = '2026-11-18 23:50:00'

  test('an unlock lands on the day of the zone it is counted in', () => {
    expect(unlockDay(UNLOCK, 'Europe/Madrid')).toBe('2026-11-19')
    expect(unlockDay(UNLOCK, 'UTC')).toBe('2026-11-18')
    // Behind UTC: 19:00 on Nov 18 in New York, and 23:30 UTC on Nov 19 is still Nov 19 there.
    expect(unlockDay(UNLOCK, 'America/New_York')).toBe('2026-11-18')
    expect(unlockDay('2026-11-19 03:30:00', 'America/New_York')).toBe('2026-11-18')
  })

  test('without a zone, the browser’s own (jest cannot switch the process zone: built from a local time)', () => {
    // 00:50 on Nov 19 wherever the test runs, sent as the platforms send it: UTC, no zone.
    const local = new Date(2026, 10, 19, 0, 50)
    const sent = local.toISOString().slice(0, 19).replace('T', ' ')
    expect(unlockDay(sent)).toBe('2026-11-19')
    expect(dayIn(local)).toBe('2026-11-19')
    expect(unlockDay(sent)).toBe(dayIn(local, Intl.DateTimeFormat().resolvedOptions().timeZone))
  })

  test('reads a date with a zone as it says, and nothing from an unreadable one', () => {
    expect(unlockDay('2026-11-18T23:50:00+00:00', 'Europe/Madrid')).toBe('2026-11-19')
    expect(unlockDay('2026-11-18T23:50:00Z', 'UTC')).toBe('2026-11-18')
    expect(unlockDay(null, 'UTC')).toBe('')
    expect(unlockDay('nope', 'UTC')).toBe('')
  })

  test('isTimeZone takes IANA names only', () => {
    for (const zone of ['UTC', 'Europe/Madrid', 'America/New_York', 'America/Argentina/Buenos_Aires', 'Etc/GMT+3']) expect(isTimeZone(zone)).toBe(true)
    for (const zone of ['Mars/Olympus', '+01:00', '', 'Europe/../Madrid', 'A'.repeat(80), null, 3]) expect(isTimeZone(zone)).toBe(false)
  })
})

describe('formatWeekdayDay', () => {
  test('the weekday with a capital, then the one format', () => {
    expect(formatWeekdayDay('2020-11-13', 'en')).toBe('Friday, Nov 13, 2020')
    expect(formatWeekdayDay('2020-11-13', 'es')).toMatch(/^Viernes, 13 nov/)
  })
})

describe('upperFirst', () => {
  test('capitalises the first letter only', () => {
    expect(upperFirst('noviembre de 2026', 'es')).toBe('Noviembre de 2026')
    expect(upperFirst('', 'es')).toBe('')
  })
})
