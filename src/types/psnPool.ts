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

/** The pool as the admin panel reads it; `metrics` (#180) when they were read, `switches` this deployment's PSN_MODE and PSN_POOL_ENABLED. */
export type PsnPoolStatus = {
  accounts: PsnAccountInfo[]
  pool: PsnPoolSummary
  metrics?: PsnMetrics
  switches?: { mode: 'live' | 'queue' | 'stale'; poolEnabled: boolean }
}

/** One account's last hour (#180): its calls by function, Sony's refusals by kind, and how long a call took. */
export type PsnAccountMetrics = {
  accountId: number
  calls: number
  callsPerMin: number
  byFn: Record<string, number>
  rateLimited: number
  /** 0–100. */
  rateLimitedPct: number
  /** Its sign-in refused (401). */
  authErrors: number
  /** A hidden profile (403): the profile's answer, not the account's fault. */
  forbidden: number
  serverErrors: number
  p95Ms: number | null
}

/** The pool's numbers for the dashboard and the alerts (#180). Times in ms. */
export type PsnMetrics = {
  accounts: PsnAccountMetrics[]
  /** The last 5 minutes, for the "429 above 1 %" alert. */
  calls5m: number
  rateLimited5m: number
  /** A call to Sony, the last hour. */
  sonyP95Ms: number | null
  /** A PSN page read, the last 15 minutes, and how many there were. */
  readP95Ms: number | null
  reads15m: number
  /** The reads of the last hour answered from the store at once (the rest waited for a first sync), 0–100. */
  readsServedPct: number | null
  queue: {
    /** Jobs due now and not taken. */
    due: number
    /** Jobs waiting, due or not (a chunk queued again, a retry). */
    queued: number
    running: number
    /** How late a job starts after it is due: those started in the last hour and those still waiting. */
    lagP95Ms: number | null
    lagSamples: number
  }
}
