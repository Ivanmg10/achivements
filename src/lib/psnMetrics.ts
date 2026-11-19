import pool from '@/lib/db'
import { runLater } from '@/lib/runLater'
import type { PsnDb } from '@/lib/psnAccounts'
import type { PsnAccountMetrics, PsnMetrics } from '@/types/psnPool'

/**
 * The PSN pool's numbers (#180), read from the database so every instance adds to the same ones: the calls per
 * account and function and Sony's refusals (psn_account_stats, written with each call by psnAccounts), how long a
 * call to Sony and a PSN page read take (psn_timings, migration 049), and the queue's depth and lag (psn_sync_jobs).
 * What the admin dashboard shows and the alerts (psnAlerts) watch. Never a user's id, a token or an online ID.
 */

/** Records one PSN page read after the answer: its time, and whether the store answered (a 202 waited). */
export function recordPsnRead(ms: number, served: boolean): void {
  runLater(async () => {
    await pool.query(`INSERT INTO psn_timings (kind, ms, ok) VALUES ('read', $1, $2)`, [Math.round(ms), served])
  })
}

/**
 * A PSN page read's route handler, timed for the metrics: a 200 is the store answering, a 202 a read that waits
 * for the first sync. Errors are not timed (the alerts count them elsewhere).
 */
export function timedPsnRead<A extends unknown[]>(handler: (...args: A) => Promise<Response>): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    const started = Date.now()
    const res = await handler(...args)
    if (res.status === 200 || res.status === 202) recordPsnRead(Date.now() - started, res.status === 200)
    return res
  }
}

type AccountRow = { account_id: number; calls: number; rate_limited: number; auth_errors: number; forbidden: number; server_errors: number }
type FnRow = { account_id: number; fn: string; calls: number }
type TimingRow = { account_id: number | null; kind: 'sony' | 'sony-all' | 'read'; p95: number | string | null; n: number; ok: number | string }
type QueueRow = { due: number; queued: number; running: number; lag_p95: number | string | null; lag_n: number }
type RecentRow = { calls: number; rate_limited: number }

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0)
const ms = (n: number | string | null | undefined) => (n === null || n === undefined ? null : Math.round(Number(n)))

function accountMetrics(rows: AccountRow[], fns: FnRow[], timings: TimingRow[]): PsnAccountMetrics[] {
  return rows.map((r) => ({
    accountId: r.account_id,
    calls: r.calls,
    callsPerMin: Math.round((r.calls / 60) * 10) / 10,
    byFn: Object.fromEntries(fns.filter((f) => f.account_id === r.account_id).map((f) => [f.fn, f.calls])),
    rateLimited: r.rate_limited,
    rateLimitedPct: pct(r.rate_limited, r.calls),
    authErrors: r.auth_errors,
    forbidden: r.forbidden,
    serverErrors: r.server_errors,
    p95Ms: ms(timings.find((t) => t.kind === 'sony' && t.account_id === r.account_id)?.p95),
  }))
}

const ACCOUNTS_SQL = `
  SELECT account_id, SUM(calls)::int AS calls, SUM(rate_limited)::int AS rate_limited, SUM(auth_errors)::int AS auth_errors,
         SUM(forbidden)::int AS forbidden, SUM(server_errors)::int AS server_errors
    FROM psn_account_stats WHERE minute > NOW() - INTERVAL '1 hour' GROUP BY account_id ORDER BY account_id`

const FNS_SQL = `
  SELECT account_id, f.key AS fn, SUM(f.value::int)::int AS calls
    FROM psn_account_stats, jsonb_each_text(by_fn) AS f
   WHERE minute > NOW() - INTERVAL '1 hour' GROUP BY account_id, f.key`

const TIMINGS_SQL = `
  SELECT account_id, 'sony' AS kind, percentile_cont(0.95) WITHIN GROUP (ORDER BY ms) AS p95, COUNT(*)::int AS n, 0 AS ok
    FROM psn_timings WHERE kind = 'sony' AND at > NOW() - INTERVAL '1 hour' GROUP BY account_id
  UNION ALL
  SELECT NULL, 'sony-all', percentile_cont(0.95) WITHIN GROUP (ORDER BY ms), COUNT(*)::int, 0
    FROM psn_timings WHERE kind = 'sony' AND at > NOW() - INTERVAL '1 hour'
  UNION ALL
  SELECT NULL, 'read', percentile_cont(0.95) WITHIN GROUP (ORDER BY ms) FILTER (WHERE at > NOW() - INTERVAL '15 minutes'),
         COUNT(*) FILTER (WHERE at > NOW() - INTERVAL '15 minutes')::int,
         COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE ok) / NULLIF(COUNT(*), 0), 1), -1)
    FROM psn_timings WHERE kind = 'read' AND at > NOW() - INTERVAL '1 hour'`

const RECENT_SQL = `
  SELECT COALESCE(SUM(calls), 0)::int AS calls, COALESCE(SUM(rate_limited), 0)::int AS rate_limited
    FROM psn_account_stats WHERE minute > NOW() - INTERVAL '5 minutes'`

/** Lag: jobs started in the last hour (started_at - run_after) and jobs due and still waiting (now - run_after). */
const QUEUE_SQL = `
  WITH lags AS (
    SELECT EXTRACT(EPOCH FROM (started_at - run_after)) * 1000 AS lag FROM psn_sync_jobs WHERE started_at > NOW() - INTERVAL '1 hour'
    UNION ALL
    SELECT EXTRACT(EPOCH FROM (NOW() - run_after)) * 1000 FROM psn_sync_jobs WHERE status = 'queued' AND run_after <= NOW()
  )
  SELECT (SELECT COUNT(*) FROM psn_sync_jobs WHERE status = 'queued' AND run_after <= NOW())::int AS due,
         (SELECT COUNT(*) FROM psn_sync_jobs WHERE status = 'queued')::int AS queued,
         (SELECT COUNT(*) FROM psn_sync_jobs WHERE status = 'running')::int AS running,
         (SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY GREATEST(lag, 0)) FROM lags) AS lag_p95,
         (SELECT COUNT(*) FROM lags)::int AS lag_n`

/** The pool's numbers now (database only). `db` is pre's read-only client when production reports on pre. */
export async function psnMetrics(db: PsnDb = pool): Promise<PsnMetrics> {
  const [accounts, fns, timings, recent, queue] = await Promise.all(
    [ACCOUNTS_SQL, FNS_SQL, TIMINGS_SQL, RECENT_SQL, QUEUE_SQL].map((sql) => db.query(sql)),
  )
  const t = timings.rows as TimingRow[]
  const read = t.find((x) => x.kind === 'read')
  const q = (queue.rows[0] ?? { due: 0, queued: 0, running: 0, lag_p95: null, lag_n: 0 }) as QueueRow
  const r = (recent.rows[0] ?? { calls: 0, rate_limited: 0 }) as RecentRow
  return {
    accounts: accountMetrics(accounts.rows as AccountRow[], fns.rows as FnRow[], t),
    calls5m: r.calls,
    rateLimited5m: r.rate_limited,
    sonyP95Ms: ms(t.find((x) => x.kind === 'sony-all')?.p95),
    readP95Ms: ms(read?.p95),
    reads15m: read?.n ?? 0,
    readsServedPct: read && Number(read.ok) >= 0 ? Number(read.ok) : null,
    queue: { due: q.due, queued: q.queued, running: q.running, lagP95Ms: ms(q.lag_p95), lagSamples: q.lag_n },
  }
}
