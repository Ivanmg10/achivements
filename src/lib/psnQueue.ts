import { randomUUID } from 'node:crypto'
import pool from '@/lib/db'
import { queryRows } from '@/lib/queryRows'
import { PsnBusyError, PsnError } from '@/lib/psnErrors'
import { psnMode } from '@/lib/psnMode'

/**
 * The PSN sync queue (#179): psn_sync_jobs (migration 047). A job is one phase of one user's sync; the worker
 * (`drainPsnQueue`) takes the most urgent first, oldest first within a priority, one at a time per instance,
 * any number of instances at once (`FOR UPDATE SKIP LOCKED`). One active job per user and phase (the unique
 * index): asking again only makes the queued one more urgent.
 *
 * Vercel's Hobby plan runs crons daily at most, so the queue is drained after PSN traffic (`psnSync.kickPsnSync`,
 * from `after()`) and by `/api/cron/psn-worker` once a day. On a Pro plan that cron runs every minute and the kicks
 * only make a sync start sooner.
 */
export type PsnPhase = 'summary' | 'titles' | 'enrich' | 'recent' | 'history' | 'score'
export const PSN_PHASES: readonly PsnPhase[] = ['summary', 'titles', 'enrich', 'recent', 'history', 'score']
/** The core: what PSN_MODE=queue still runs (#180). */
export const CORE_PHASES: readonly PsnPhase[] = ['summary', 'titles']

/** Lower runs first: what the user just did, then a first sync, then upkeep, then the long tail. */
export const PRIORITY = { link: 0, manual: 1, first: 2, cron: 3, history: 4, score: 5 } as const

export type PsnJob = { id: number; userId: number; phase: PsnPhase; priority: number; attempts: number }
/** What a finished job asks for next. */
export type NextJob = { phase: PsnPhase; priority: number; delayMs?: number }
export type JobRunner = (job: PsnJob) => Promise<NextJob[]>

/** A running job whose instance died is taken again after this. */
const LOCK_SECONDS = 90
const MAX_ATTEMPTS = 5
/** A job that would not fit in what is left of the drain's time is left for the next one. */
const JOB_MARGIN_MS = 10_000

export async function enqueuePsn(userId: number | string, phase: PsnPhase, priority: number, delayMs = 0): Promise<void> {
  await pool.query(
    `INSERT INTO psn_sync_jobs (user_id, phase, priority, run_after) VALUES ($1, $2, $3, now() + make_interval(secs => $4))
     ON CONFLICT (user_id, phase) WHERE status IN ('queued', 'running') DO UPDATE
       SET priority = LEAST(psn_sync_jobs.priority, EXCLUDED.priority), run_after = LEAST(psn_sync_jobs.run_after, EXCLUDED.run_after), updated_at = now()
       WHERE psn_sync_jobs.status = 'queued'`,
    [Number(userId), phase, priority, delayMs / 1000],
  )
}

/**
 * The next job due among `phases`, now running on `worker`; null when none is. The first claim stamps
 * `started_at`, so the queue's lag (started_at - run_after) is measured (#180).
 */
export async function claimPsnJob(worker: string, phases: readonly PsnPhase[] = PSN_PHASES): Promise<PsnJob | null> {
  const [row] = await queryRows<{ id: string; user_id: number; phase: PsnPhase; priority: number; attempts: number }>(
    `UPDATE psn_sync_jobs SET status = 'running', locked_by = $1, locked_until = now() + make_interval(secs => $2),
            attempts = attempts + 1, updated_at = now(), started_at = COALESCE(started_at, now())
      WHERE id = (
        SELECT id FROM psn_sync_jobs
         WHERE ((status = 'queued' AND run_after <= now()) OR (status = 'running' AND locked_until < now()))
           AND phase = ANY($3::text[])
         ORDER BY priority, run_after
         LIMIT 1
         FOR UPDATE SKIP LOCKED)
      RETURNING id, user_id, phase, priority, attempts`,
    [worker, LOCK_SECONDS, phases],
  )
  return row ? { id: Number(row.id), userId: row.user_id, phase: row.phase, priority: row.priority, attempts: row.attempts } : null
}

export async function finishPsnJob(id: number): Promise<void> {
  await pool.query(`UPDATE psn_sync_jobs SET status = 'done', locked_by = NULL, locked_until = NULL, error = NULL, updated_at = now() WHERE id = $1`, [id])
}

/** Back in the queue after `delayMs`, or failed for good after MAX_ATTEMPTS. `error` is a short code, never Sony's text. */
export async function retryPsnJob(job: PsnJob, delayMs: number, error: string, countsAsAttempt = true): Promise<void> {
  const failed = countsAsAttempt && job.attempts >= MAX_ATTEMPTS
  await pool.query(
    `UPDATE psn_sync_jobs SET status = $2, run_after = now() + make_interval(secs => $3), error = $4,
            attempts = attempts - $5, locked_by = NULL, locked_until = NULL, updated_at = now()
      WHERE id = $1`,
    [job.id, failed ? 'failed' : 'queued', delayMs / 1000, error, countsAsAttempt ? 0 : 1],
  )
}

/** The user's queued and running jobs, for the status route. */
export async function psnJobsOf(userId: number | string): Promise<Array<{ phase: PsnPhase; status: 'queued' | 'running'; priority: number }>> {
  return queryRows(`SELECT phase, status, priority FROM psn_sync_jobs WHERE user_id = $1 AND status IN ('queued', 'running') ORDER BY priority, run_after`, [Number(userId)])
}

export type PsnQueueView = {
  jobs: Array<{ phase: PsnPhase; status: 'queued' | 'running'; error: string | null }>
  /** A job of the user's failed for good in the last hour. */
  failedRecently: boolean
  /** Jobs of others due before the user's most urgent queued one (0 while one of theirs runs). */
  ahead: number
}

/** The user's place in the queue, for the sync state (#180): their jobs, a recent failure, and how many go first. */
export async function psnQueueOf(userId: number | string): Promise<PsnQueueView> {
  const [row] = await queryRows<{ jobs: PsnQueueView['jobs'] | null; failed: boolean; ahead: number }>(
    `WITH mine AS (
       SELECT phase, status, error, priority, run_after FROM psn_sync_jobs WHERE user_id = $1 AND status IN ('queued', 'running')
     ), first AS (
       SELECT priority, run_after FROM mine WHERE status = 'queued' ORDER BY priority, run_after LIMIT 1
     )
     SELECT (SELECT json_agg(json_build_object('phase', phase, 'status', status, 'error', error) ORDER BY priority, run_after) FROM mine) AS jobs,
            EXISTS (SELECT 1 FROM psn_sync_jobs WHERE user_id = $1 AND status = 'failed' AND updated_at > now() - interval '1 hour') AS failed,
            CASE WHEN EXISTS (SELECT 1 FROM mine WHERE status = 'running') THEN 0 ELSE
              (SELECT count(*) FROM psn_sync_jobs j, first f
                WHERE j.status = 'queued' AND j.run_after <= now() AND j.user_id <> $1
                  AND (j.priority, j.run_after) < (f.priority, f.run_after)) END::int AS ahead`,
    [Number(userId)],
  )
  return { jobs: row?.jobs ?? [], failedRecently: row?.failed ?? false, ahead: row?.ahead ?? 0 }
}

/** Finished jobs older than a week go: the alerts read the last hour only. */
export async function sweepPsnJobs(): Promise<void> {
  await pool.query(`DELETE FROM psn_sync_jobs WHERE status IN ('done', 'failed') AND updated_at < now() - interval '7 days'`)
}

/**
 * Runs due jobs until `deadline` (ms) or none is left, one at a time. A job's follow-ups are queued after it is
 * marked done, so a phase may queue itself again (history, 20 games a job). How many jobs ran. PSN_MODE=stale
 * runs none and PSN_MODE=queue only the core (psnMode, #180): the rest waits in the queue.
 */
export async function drainPsnQueue(run: JobRunner, deadline: number): Promise<number> {
  const mode = psnMode()
  if (mode === 'stale') return 0
  const phases = mode === 'queue' ? CORE_PHASES : PSN_PHASES
  const worker = randomUUID()
  let ran = 0
  while (Date.now() < deadline - JOB_MARGIN_MS) {
    const job = await claimPsnJob(worker, phases)
    if (!job) break
    ran++
    let next: NextJob[]
    try {
      next = await run(job)
    } catch (err) {
      await retryAfterFailure(job, err)
      continue
    }
    await finishPsnJob(job.id)
    for (const n of next) await enqueuePsn(job.userId, n.phase, n.priority, n.delayMs)
  }
  return ran
}

/** How a failed job waits: the app's budget spent is not the job's fault; Sony's refusals and the rest are. */
export function psnRetryFor(err: unknown): { delayMs: number; error: string; countsAsAttempt: boolean } {
  if (err instanceof PsnBusyError) return { delayMs: 60_000, error: 'busy', countsAsAttempt: false }
  if (err instanceof PsnError && err.isRateLimited) return { delayMs: 60_000, error: 'rate-limited', countsAsAttempt: true }
  return { delayMs: 60_000, error: 'failed', countsAsAttempt: true }
}

async function retryAfterFailure(job: PsnJob, err: unknown): Promise<void> {
  const { delayMs, error, countsAsAttempt } = psnRetryFor(err)
  if (error === 'failed') console.error('[psnQueue]', job.phase, job.userId, err)
  // 1, 2, 4, 8 minutes for a job that keeps failing.
  await retryPsnJob(job, delayMs * 2 ** Math.max(0, job.attempts - 1), error, countsAsAttempt).catch((e: unknown) => console.error('[psnQueue] retry', e))
}
