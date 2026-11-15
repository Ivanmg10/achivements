import pool from '@/lib/db'
import { preDatabase } from '@/lib/preDb'
import { daysLeft, listPsnAccounts, type PsnDb } from '@/lib/psnAccounts'
import { summarizePsnPool } from '@/utils/psnPool'
import type { PsnPoolStatus } from '@/types/psnPool'
import type { PsnAlertEnv } from '@/lib/psnAlertMessages'

/** The pool as the admin panel, the alerts and the status route read it (#178). Database only; never a secret. */
export async function psnPoolStatus(now = Date.now(), db: PsnDb = pool): Promise<PsnPoolStatus> {
  const [accounts, sync] = await Promise.all([listPsnAccounts(db), syncOutcomes(db)])
  return { accounts, pool: summarizePsnPool(accounts, sync, now) }
}

/** Sync jobs finished in the last hour (phase 4's queue, #179): none until it runs. */
async function syncOutcomes(db: PsnDb): Promise<{ failed: number; total: number }> {
  const { rows } = await db.query(
    `SELECT COUNT(*) FILTER (WHERE status = 'failed')::int AS failed, COUNT(*)::int AS total
       FROM psn_sync_jobs WHERE status IN ('done', 'failed') AND updated_at > NOW() - INTERVAL '1 hour'`,
  )
  return { failed: rows[0]?.failed ?? 0, total: rows[0]?.total ?? 0 }
}

type Env = Record<string, string | undefined>

/** Which environment this deployment's pool is: production, pre (Vercel's preview), or null on a local machine. */
export function psnPoolEnv(env: Env = process.env): PsnAlertEnv | null {
  return env.VERCEL_ENV === 'production' ? 'PRO' : env.VERCEL_ENV === 'preview' ? 'PRE' : null
}

/**
 * Pre's pool, read from production (#178): Vercel runs crons only on production, so production reports pre's pool
 * too. Only on production, with `PREVIEW_DATABASE_URL` set there (db.js never uses it in production, so it is read
 * by this alone), and inside a READ ONLY transaction: production never writes to pre. Null when not set up.
 */
export async function prePoolStatus(now = Date.now(), env: Env = process.env): Promise<PsnPoolStatus | null> {
  const url = env.PREVIEW_DATABASE_URL?.trim()
  if (env.VERCEL_ENV !== 'production' || !url || url === env.DATABASE_URL?.trim()) return null
  const client = await (await preDatabase(url)).connect()
  try {
    await client.query('BEGIN TRANSACTION READ ONLY')
    const status = await psnPoolStatus(now, client)
    await client.query('COMMIT')
    return status
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

const iso = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString())

/**
 * What `/api/ops/psn/status` (the owner's own agent) may read: labels, states, days left, calls and the canary.
 * Not the hint, the online ID or anything else that could say whose account it is.
 */
export function opsView({ accounts, pool: summary }: PsnPoolStatus, now = Date.now()) {
  return {
    environment: psnPoolEnv() ?? 'local',
    pool: {
      accounts: summary.accounts,
      active: summary.active,
      usable: summary.usable,
      cooling: summary.cooling,
      quarantined: summary.quarantined,
      callsLastHour: summary.callsLastHour,
      rateLimitedPct: summary.rateLimitedPct,
      syncFailed: summary.syncFailed,
      syncTotal: summary.syncTotal,
      nextRenewal: summary.suggestion ? { label: summary.suggestion.label, at: iso(summary.suggestion.at) } : null,
    },
    accounts: accounts.map((a) => ({
      label: a.label,
      status: a.status,
      coolingUntil: a.cooldownUntil !== null && a.cooldownUntil > now ? iso(a.cooldownUntil) : null,
      npssoDaysLeft: daysLeft(a.npssoExpiresAt, now),
      npssoExpiresAt: iso(a.npssoExpiresAt),
      callsLastHour: a.callsLastHour,
      rateLimitedLastHour: a.rateLimitedLastHour,
      canary: a.canaryAt === null ? null : { ok: a.canaryOk === true, at: iso(a.canaryAt) },
    })),
  }
}
