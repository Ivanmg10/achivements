/**
 * The moment of a date the platforms send, in ms (NaN when unreadable).
 *
 * RA, and every unlock feed built on the same shape, send "2026-10-17 18:30:00"
 * with no zone, and it is UTC. `new Date('2026-10-17T18:30:00')` reads that as
 * local time, off by the viewer's offset (a day near midnight), so every parse of
 * such a string goes through here. A string that already carries a zone ("Z" or
 * an offset) is read as it says.
 */
export function parseUnlockTime(s: string | null | undefined): number {
  if (!s) return NaN
  const iso = s.replace(' ', 'T')
  // A date alone ("2026-10-17") is already UTC for Date.parse.
  return Date.parse(iso.length <= 10 || /(Z|[+-]\d\d:?\d\d)$/i.test(iso) ? iso : `${iso}Z`)
}

/** The same moment as an ISO string ("…T18:30:00.000Z"), or null when there is none to read. */
export function unlockIso(s: string | null | undefined): string | null {
  const t = parseUnlockTime(s)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

/** "2026-10-17" of a moment, in UTC: the day key of every unlock count kept on the server. */
export function utcDay(d: Date | number): string {
  return new Date(d).toISOString().slice(0, 10)
}

/** "2026-10-17" of a moment, in the reader's local time (the calendar they look at). */
export function localDay(d: Date | number): string {
  const day = new Date(d)
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
}

const DAY_MONTH_YEAR: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }

/** A platform date for a reader, in their language ("03 oct 2026"); "—" when there is none. */
export function formatDate(s: string | null | undefined, lang: string, options: Intl.DateTimeFormatOptions = DAY_MONTH_YEAR): string {
  const t = parseUnlockTime(s)
  return Number.isNaN(t) ? '—' : new Date(t).toLocaleDateString(lang, options)
}

/**
 * How long ago, in the given language ("2 hours ago", "hace 2 horas"), in the
 * largest unit that fits. "—" when there is no date to tell.
 */
export function relativeTime(dateStr: string | null | undefined, lang = 'en'): string {
  if (!dateStr) return '—'
  const t = parseUnlockTime(dateStr)
  if (isNaN(t)) return '—'
  const secs = Math.round((t - Date.now()) / 1000)
  const fmt = new Intl.RelativeTimeFormat(lang, { numeric: 'auto', style: 'short' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]]
  for (const [unit, size] of units) {
    if (Math.abs(secs) >= size) return fmt.format(Math.trunc(secs / size), unit)
  }
  return fmt.format(0, 'minute')
}

export type SpanLabels = { underMinute: string; minutes: string; hours: string; days: string; months: string }

/**
 * How long it took from the first unlock to the last, in the largest unit
 * that fits ("{n}" in each label is the count). Null with fewer than two
 * dated unlocks: there is no span to tell.
 */
export function unlockSpan(dates: (string | null | undefined)[], labels: SpanLabels): string | null {
  const times = dates.filter((d): d is string => !!d).map((d) => new Date(d).getTime()).filter((t) => !Number.isNaN(t))
  if (times.length < 2) return null
  const mins = Math.floor((Math.max(...times) - Math.min(...times)) / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return labels.underMinute
  if (hours < 1) return labels.minutes.replace('{n}', String(mins))
  if (days < 1) return labels.hours.replace('{n}', String(hours))
  if (days < 30) return labels.days.replace('{n}', String(days))
  return labels.months.replace('{n}', String(Math.floor(days / 30)))
}

/**
 * A calendar day ("2026-06-05") in the app's language, read as a local date:
 * parsed as UTC it can land on the day before west of Greenwich.
 */
export function formatDay(day: string, lang: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString(lang, options)
}

/** Every day from `start` to `end` (inclusive), as "YYYY-MM-DD", local time. */
export function daysBetween(start: string, end: string): string[] {
  const out: string[] = []
  const d = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)
  while (d <= last) {
    out.push(localDay(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}
