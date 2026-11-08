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
