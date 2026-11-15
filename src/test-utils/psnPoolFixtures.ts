import type { PsnAccountInfo, PsnPoolStatus } from '@/types/psnPool'
import { summarizePsnPool } from '@/utils/psnPool'

export const DAY_MS = 86_400_000
/** 2026-11-15T12:00:00Z. */
export const NOW = Date.UTC(2026, 10, 15, 12)

/** One service account as the admin panel sees it: PSN-1, active, 40 days left, canary ok. */
export function psnAccount(over: Partial<PsnAccountInfo> = {}): PsnAccountInfo {
  return {
    id: 1,
    label: 'PSN-1',
    hint: null,
    onlineId: 'ServiceOne',
    avatarUrl: null,
    status: 'active',
    weight: 1,
    concurrency: 4,
    ratePerMin: 40,
    npssoExpiresAt: NOW + 40 * DAY_MS + 1000,
    renewedAt: NOW - 20 * DAY_MS,
    renewedBy: 'ivan',
    lastOkAt: NOW,
    lastError: null,
    cooldownUntil: null,
    canaryAt: NOW - 60_000,
    canaryOk: true,
    warnedAt: null,
    callsLastHour: 0,
    rateLimitedLastHour: 0,
    ...over,
  }
}

export function psnStatus(accounts: PsnAccountInfo[], sync = { failed: 0, total: 0 }, now = NOW): PsnPoolStatus {
  return { accounts, pool: summarizePsnPool(accounts, sync, now) }
}
