import type { PsnAccountInfo, PsnPoolSummary, PsnRenewalSuggestion } from '@/types/psnPool'

/**
 * The PSN pool at a glance (#178), from its accounts: what is usable, when the next sign-in dies, and when to
 * renew which so they never die together. An NPSSO lasts 60 days from the sign-in that made it, so five
 * accounts renewed on one day all stop on one day: one renewal every ~12 days keeps them apart.
 */

const DAY_MS = 86_400_000
const NPSSO_DAYS = 60
/** Two sign-ins dying closer than this are flagged. */
const CROWDED_DAYS = 7
/** The suggested renewal is never later than this before the sign-in dies. */
const RENEW_MARGIN_DAYS = 3
/** The spacing aimed for: 60 days shared among the accounts, at most 12. */
const MAX_GAP_DAYS = 12

/** Whole days left before a deadline, never negative; null when it is not known. */
export function daysUntil(at: number | null, now = Date.now()): number | null {
  return at === null ? null : Math.max(0, Math.floor((at - now) / DAY_MS))
}

const dated = (accounts: PsnAccountInfo[]) => accounts.filter((a) => a.npssoExpiresAt !== null)

/** The accounts whose sign-in dies within 7 days of another's. */
export function crowdedAccounts(accounts: PsnAccountInfo[]): number[] {
  const list = dated(accounts)
  const near = (a: PsnAccountInfo, b: PsnAccountInfo) => Math.abs(a.npssoExpiresAt! - b.npssoExpiresAt!) < CROWDED_DAYS * DAY_MS
  return list.filter((a) => list.some((b) => b.id !== a.id && near(a, b))).map((a) => a.id)
}

/**
 * The next renewal: the account that dies first, on the latest day (at least 3 days before it dies) whose
 * new 60 days end far enough from every other account's. With one account, simply 3 days before it dies.
 */
export function suggestRenewal(accounts: PsnAccountInfo[], now = Date.now()): PsnRenewalSuggestion | null {
  const list = dated(accounts)
  if (list.length === 0) return null
  const first = list.reduce((a, b) => (b.npssoExpiresAt! < a.npssoExpiresAt! ? b : a))
  const others = list.filter((a) => a.id !== first.id).map((a) => a.npssoExpiresAt!)
  const gap = Math.min(MAX_GAP_DAYS, NPSSO_DAYS / list.length) * DAY_MS
  const latest = Math.max(now, first.npssoExpiresAt! - RENEW_MARGIN_DAYS * DAY_MS)
  for (let at = latest; at >= now; at -= DAY_MS) {
    const dies = at + NPSSO_DAYS * DAY_MS
    if (others.every((e) => Math.abs(e - dies) >= gap)) return { accountId: first.id, label: first.label, at }
  }
  return { accountId: first.id, label: first.label, at: latest }
}

export function summarizePsnPool(accounts: PsnAccountInfo[], sync: { failed: number; total: number }, now = Date.now()): PsnPoolSummary {
  const count = (test: (a: PsnAccountInfo) => boolean) => accounts.filter(test).length
  const cooling = (a: PsnAccountInfo) => a.cooldownUntil !== null && a.cooldownUntil > now
  const calls = accounts.reduce((sum, a) => sum + a.callsLastHour, 0)
  const limited = accounts.reduce((sum, a) => sum + a.rateLimitedLastHour, 0)
  const live = dated(accounts).filter((a) => a.status !== 'paused')
  const next = live.length ? live.reduce((a, b) => (b.npssoExpiresAt! < a.npssoExpiresAt! ? b : a)) : null
  return {
    accounts: accounts.length,
    active: count((a) => a.status === 'active'),
    usable: count((a) => a.status === 'active' && !cooling(a)),
    cooling: count((a) => a.status === 'active' && cooling(a)),
    quarantined: count((a) => a.status === 'quarantined'),
    paused: count((a) => a.status === 'paused'),
    draining: count((a) => a.status === 'draining'),
    callsLastHour: calls,
    rateLimitedLastHour: limited,
    rateLimitedPct: calls ? Math.round((limited / calls) * 1000) / 10 : 0,
    nextExpiry: next
      ? { accountId: next.id, label: next.label, at: next.npssoExpiresAt!, daysLeft: daysUntil(next.npssoExpiresAt, now)! }
      : null,
    suggestion: suggestRenewal(live, now),
    crowded: crowdedAccounts(live),
    syncFailed: sync.failed,
    syncTotal: sync.total,
  }
}
