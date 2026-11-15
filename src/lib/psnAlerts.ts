import pool from '@/lib/db'
import { daysLeft } from '@/lib/psnAccounts'
import {
  alertMessage,
  digestText,
  npssoExpiringText,
  poolLowText,
  quarantinedText,
  rateLimitedText,
  syncFailuresText,
  type PsnAlertEnv,
} from '@/lib/psnAlertMessages'
import { prePoolStatus, psnPoolEnv, psnPoolStatus } from '@/lib/psnPoolStatus'
import { sendTelegram, telegramConfigured, type TelegramResult } from '@/lib/telegram'
import { utcDay } from '@/utils/dates'
import type { PsnPoolStatus } from '@/types/psnPool'

/**
 * The PSN pool's alerts to the owner over Telegram (#178): a sign-in about to die (14, 7, 3 and 1 days, per
 * account), a quarantined account (its refresh and its NPSSO refused), too many 429s, fewer than two usable
 * accounts, failing syncs, and a daily digest after 09:00 UTC. The texts are in `psnAlertMessages.ts`.
 *
 * Only production sends, one message per environment: production's pool tagged PRO and, when it can read it,
 * pre's tagged PRE (Vercel runs crons on production only). Pre and a local machine never send. Which alert went
 * out when is kept in production's `psn_alert_state` (pre's under a `pre:` prefix), so each goes out once.
 * Without Telegram nothing is sent here: `/api/cron/psnToken` mails the admins about expiring sign-ins instead.
 */

export type PsnAlert = { kind: string; accountId: number; text: string }
type EnvResult = { sent: number; result: TelegramResult | 'nothing' | 'failed-to-read' }

const NPSSO_STEPS = [1, 3, 7, 14]
/** How long before the same alert may be sent again. An NPSSO step is keyed by the expiry, so it is sent once per sign-in. */
const REPEAT_HOURS: Record<string, number> = { npsso: 24 * 90, quarantined: 24, 'rate-limited': 6, 'pool-low': 6, 'sync-failures': 6, digest: 20 }
const RATE_LIMITED_PCT = 5
const SYNC_FAILED_PCT = 5
/** Too few calls or jobs to say anything about a rate. */
const MIN_SAMPLE = 20
const DIGEST_HOUR_UTC = 9

function repeatHours(kind: string): number {
  const base = kind.replace(/^pre:/, '')
  return base.startsWith('npsso-') ? REPEAT_HOURS.npsso : (REPEAT_HOURS[base] ?? 24)
}

function accountAlerts({ accounts }: PsnPoolStatus, now: number): PsnAlert[] {
  return accounts.flatMap((a) => {
    if (a.status === 'paused') return []
    const out: PsnAlert[] = []
    const left = daysLeft(a.npssoExpiresAt, now)
    const step = left === null ? undefined : NPSSO_STEPS.find((s) => left <= s)
    if (step !== undefined) {
      out.push({ kind: `npsso-${step}-${utcDay(new Date(a.npssoExpiresAt!))}`, accountId: a.id, text: npssoExpiringText(a.label, left!, a.npssoExpiresAt!) })
    }
    if (a.status === 'quarantined') out.push({ kind: 'quarantined', accountId: a.id, text: quarantinedText(a.label) })
    return out
  })
}

/** The alerts the pool's state calls for now, before deduplication. */
export function dueAlerts(status: PsnPoolStatus, now = Date.now()): PsnAlert[] {
  const { pool: p, accounts } = status
  const out = accountAlerts(status, now)
  if (p.callsLastHour >= MIN_SAMPLE && p.rateLimitedPct > RATE_LIMITED_PCT) {
    out.push({ kind: 'rate-limited', accountId: 0, text: rateLimitedText(p.rateLimitedPct, p.callsLastHour) })
  }
  // Silent while the pool is one account by design: only when two or more are meant to be serving.
  const serving = accounts.filter((a) => a.status === 'active' || a.status === 'quarantined').length
  if (serving >= 2 && p.usable < 2) out.push({ kind: 'pool-low', accountId: 0, text: poolLowText(p.usable, serving) })
  if (p.syncTotal >= MIN_SAMPLE && (p.syncFailed / p.syncTotal) * 100 > SYNC_FAILED_PCT) {
    out.push({ kind: 'sync-failures', accountId: 0, text: syncFailuresText(p.syncFailed, p.syncTotal) })
  }
  return out
}

function digestAlert({ pool: p, accounts }: PsnPoolStatus, now: number): PsnAlert {
  const lines = accounts.map((a) => ({ label: a.label, status: a.status, daysLeft: daysLeft(a.npssoExpiresAt, now), canaryOk: a.canaryOk }))
  return { kind: 'digest', accountId: 0, text: digestText(p, lines, now) }
}

/** Leaves out what was sent too recently. */
async function unsent(alerts: PsnAlert[], now: number): Promise<PsnAlert[]> {
  if (alerts.length === 0) return []
  const { rows } = await pool.query('SELECT kind, account_id, last_sent_at FROM psn_alert_state')
  const sent = new Map((rows as { kind: string; account_id: number; last_sent_at: Date }[]).map((r) => [`${r.kind}:${r.account_id}`, new Date(r.last_sent_at).getTime()]))
  return alerts.filter((a) => {
    const at = sent.get(`${a.kind}:${a.accountId}`)
    return at === undefined || now - at >= repeatHours(a.kind) * 3_600_000
  })
}

async function markSent(alerts: PsnAlert[]): Promise<void> {
  await pool.query(
    `INSERT INTO psn_alert_state (kind, account_id, last_sent_at)
     SELECT kind, account_id, NOW() FROM unnest($1::text[], $2::int[]) AS t(kind, account_id)
     ON CONFLICT (kind, account_id) DO UPDATE SET last_sent_at = NOW()`,
    [alerts.map((a) => a.kind), alerts.map((a) => a.accountId)],
  )
  await pool.query(`DELETE FROM psn_alert_state WHERE last_sent_at < NOW() - INTERVAL '120 days'`)
}

/** One environment's due alerts (and the digest when due), sent as one message. */
async function alertEnv(env: PsnAlertEnv, status: PsnPoolStatus, now: number): Promise<EnvResult> {
  const digest = status.accounts.length > 0 && new Date(now).getUTCHours() >= DIGEST_HOUR_UTC
  const prefix = env === 'PRE' ? 'pre:' : ''
  const candidates = [...dueAlerts(status, now), ...(digest ? [digestAlert(status, now)] : [])].map((a) => ({ ...a, kind: prefix + a.kind }))
  const due = await unsent(candidates, now)
  if (due.length === 0) return { sent: 0, result: 'nothing' }
  const result = await sendTelegram(alertMessage(env, due.map((a) => a.text)))
  if (result === 'sent') await markSent(due)
  return { sent: result === 'sent' ? due.length : 0, result }
}

/** Sends what is due, production's pool then pre's. Skipped off production and without Telegram. */
export async function sendPsnAlerts(now = Date.now()): Promise<{ skipped?: string; PRO?: EnvResult; PRE?: EnvResult }> {
  if (psnPoolEnv() !== 'PRO') return { skipped: 'not-production' }
  if (!telegramConfigured()) return { skipped: 'not-configured' }
  const out: { PRO?: EnvResult; PRE?: EnvResult } = { PRO: await alertEnv('PRO', await psnPoolStatus(now), now) }
  try {
    const pre = await prePoolStatus(now)
    if (pre) out.PRE = await alertEnv('PRE', pre, now)
  } catch (err) {
    console.error('[psnAlerts] could not read pre’s pool', err instanceof Error ? err.message : 'unknown')
    out.PRE = { sent: 0, result: 'failed-to-read' }
  }
  return out
}
