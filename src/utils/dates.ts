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
