/** The PSN service-account pool (#178), as the admin panel, the alerts and the status route see it: never a secret. */

export type PsnAccountStatus = 'active' | 'paused' | 'draining' | 'quarantined'

/** One account. Dates are ms since the epoch. */
export type PsnAccountInfo = {
  id: number
  label: string
  /** The owner's own reminder of which account it is (never the e-mail in the repo). */
  hint: string | null
  /** Read from Sony with the account's own token. */
  onlineId: string | null
  avatarUrl: string | null
  status: PsnAccountStatus
  weight: number
  concurrency: number
  ratePerMin: number
  npssoExpiresAt: number | null
  renewedAt: number | null
  renewedBy: string | null
  lastOkAt: number | null
  lastError: string | null
  cooldownUntil: number | null
  canaryAt: number | null
  canaryOk: boolean | null
  warnedAt: number | null
  callsLastHour: number
  rateLimitedLastHour: number
}

/** What an admin may change on an account. */
export type PsnAccountPatch = Partial<Pick<PsnAccountInfo, 'status' | 'weight' | 'concurrency' | 'ratePerMin' | 'hint'>>

/** When to renew which account so the sign-ins never die together. */
export type PsnRenewalSuggestion = { accountId: number; label: string; at: number }

/** The pool at a glance. */
export type PsnPoolSummary = {
  accounts: number
  active: number
  /** Active and not resting after Sony's "too many requests". */
  usable: number
  cooling: number
  quarantined: number
  paused: number
  draining: number
  callsLastHour: number
  rateLimitedLastHour: number
  /** 0–100. */
  rateLimitedPct: number
  nextExpiry: { accountId: number; label: string; at: number; daysLeft: number } | null
  suggestion: PsnRenewalSuggestion | null
  /** Accounts whose sign-in dies within 7 days of another's. */
  crowded: number[]
  /** Sync jobs in the last hour (phase 4's queue; 0 / 0 until it exists). */
  syncFailed: number
  syncTotal: number
}

/** The pool as the admin panel reads it. */
export type PsnPoolStatus = { accounts: PsnAccountInfo[]; pool: PsnPoolSummary }
