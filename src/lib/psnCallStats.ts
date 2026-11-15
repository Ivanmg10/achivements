/**
 * How many requests went to Sony, by function and by minute, on this instance.
 * Server side only, in memory, and no ids, online IDs or tokens: a function's
 * name and a count (#175). `upstreamCount` keeps the day's total across
 * instances; this says what the calls were, which is what the call budget
 * (#177) and the metrics (#180) are built on.
 * ponytail: per instance and lost on restart; a shared store if the metrics ever need a whole-app view.
 */

/** One name per Sony endpoint the app uses (`psnClient.ts`). `auth` is the token exchange. */
export const PSN_FUNCTIONS = [
  'auth',
  'search',
  'summary',
  'profile',
  'titleCount',
  'titles',
  'played',
  'sets',
  'gameTrophies',
  'gameGroups',
] as const

export type PsnFunction = (typeof PSN_FUNCTIONS)[number]
export type PsnCallCounts = Partial<Record<PsnFunction, number>>

const MINUTE_MS = 60_000
/** Minutes kept for `psnCallsPerMinute`. */
const KEEP_MINUTES = 60

const minutes = new Map<number, PsnCallCounts>()
const totals: PsnCallCounts = {}

const total = (counts: PsnCallCounts) => Object.values(counts).reduce((sum, n) => sum + n, 0)

/** One request to Sony. When a new minute starts, the one that ended is logged (a line per busy minute, none while idle). */
export function recordPsnCall(fn: PsnFunction, now = Date.now()): void {
  const minute = Math.floor(now / MINUTE_MS)
  let counts = minutes.get(minute)
  if (!counts) {
    const last = [...minutes.entries()].at(-1)
    if (last) console.info('[psn] calls in the minute', new Date(last[0] * MINUTE_MS).toISOString(), total(last[1]), JSON.stringify(last[1]))
    counts = {}
    minutes.set(minute, counts)
    for (const old of [...minutes.keys()]) if (old <= minute - KEEP_MINUTES) minutes.delete(old)
  }
  counts[fn] = (counts[fn] ?? 0) + 1
  totals[fn] = (totals[fn] ?? 0) + 1
}

/** Calls since this instance started (or the last reset), by function. */
export function psnCallTotals(): PsnCallCounts {
  return { ...totals }
}

/** The last hour, a minute per entry, oldest first. */
export function psnCallsPerMinute(): { minute: string; calls: number; counts: PsnCallCounts }[] {
  return [...minutes.entries()].map(([m, counts]) => ({ minute: new Date(m * MINUTE_MS).toISOString(), calls: total(counts), counts: { ...counts } }))
}

/** For tests. */
export function resetPsnCallStats(): void {
  minutes.clear()
  for (const key of Object.keys(totals)) delete totals[key as PsnFunction]
}
