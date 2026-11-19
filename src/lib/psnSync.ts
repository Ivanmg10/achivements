import { queryRows } from '@/lib/queryRows'
import { DEFAULT_LANGUAGE, fetchPsnEnrichment, fetchPsnGame, fetchPsnSummary, fetchPsnTitles } from '@/lib/psnClient'
import { psnBackground } from '@/lib/psnBudget'
import { PsnBusyError, PsnError } from '@/lib/psnErrors'
import { drainPsnQueue, enqueuePsn, PRIORITY, type NextJob, type PsnJob, type PsnPhase } from '@/lib/psnQueue'
import {
  loadPsnGames,
  loadPsnPlayer,
  markPsnPrivate,
  markPsnYearReady,
  psnDeltaCount,
  psnDeltaGames,
  savePsnEnrichment,
  savePsnGameTrophies,
  savePsnSummary,
  savePsnTitles,
  setPsnLanguage,
  type DeltaGame,
} from '@/lib/psnStore'
import { runLater } from '@/lib/runLater'
import { mapLimit } from '@/utils/utils'
import { runScoreAfterSync } from '@/lib/scoreRefresh'

/**
 * The PSN sync (#179): the worker's five phases, each one job of psn_sync_jobs (psnQueue), each reading Sony as
 * little as it can and storing what it read (psnStore). Pages never wait on it: they read the store.
 *
 * - `summary`: the trophy counts (1 request; the profile too, 2, when they moved or once a day). Nothing moved
 *   and the list read in the last day: done. Else `titles`.
 * - `titles`: the trophy list (1 request per 800 games): the core, the library is there once it is stored. Then
 *   `enrich` when a game moved or a day went by, and `recent` when there is a delta.
 * - `enrich`: the played list, trophy sets and IGDB art (#180: its own job, so a crowd of first links each gets
 *   its list before anyone's play data).
 * - `recent`: the trophies of the year's games that moved (the delta), 20 games a job, until the year is whole;
 *   then `history`, or `score`.
 * - `history`: the older games that moved and the games a page asked for, 20 a job, queued again until none is
 *   left; then `score`.
 * - `score`: Vault Points from the stored trophies, no Sony call (scoreRefresh's PSN plan reads the store).
 *
 * Everything runs as background work (`psnBackground`): it may spend only three quarters of each account's
 * budget, the rest is for linking and verifying.
 */
const DAY_MS = 24 * 60 * 60 * 1000
/** The year's window, as the streak and the heatmap read it. */
const YEAR_DAYS = 366
/** Games read per `recent` or `history` job: about 20 to 60 requests, under 15 s with 4 at once. */
export const CHUNK = 20
const PARALLEL = 4
/** A kick drains this long after the answer at most (the route's own duration bounds it too). */
const KICK_MS = 20_000
/** A score pass already running for the user: try again after it. */
const SCORE_RETRY_MS = 2 * 60_000

export const yearStart = (now = Date.now()) => new Date(now - YEAR_DAYS * DAY_MS).toISOString()
const olderThan = (at: number | null, ms: number) => at === null || Date.now() - at >= ms

type Phase = (accountId: string, job: PsnJob) => Promise<NextJob[]>

const PHASES: Record<PsnPhase, Phase> = { summary, titles, enrich, recent, history, score }

/** One job: its phase, for the account the user has linked now (none: nothing to do). */
export async function runPsnJob(job: PsnJob): Promise<NextJob[]> {
  const [user] = await queryRows<{ psnaccountid: string | null }>('SELECT psnaccountid FROM users WHERE id = $1', [job.userId])
  const accountId = user?.psnaccountid
  if (!accountId) return []
  try {
    return await psnBackground(() => PHASES[job.phase](accountId, job))
  } catch (err) {
    // The profile hides its trophies: pages say so until a later sync finds it public.
    if (err instanceof PsnError && err.isPrivate) {
      await markPsnPrivate(accountId)
      return []
    }
    throw err
  }
}

async function summary(accountId: string, job: PsnJob): Promise<NextJob[]> {
  const player = await loadPsnPlayer(accountId)
  const known = player?.summary && !olderThan(player.profileAt, DAY_MS) ? player.summary : null
  const { summary: read, withProfile } = await fetchPsnSummary(accountId, known)
  await savePsnSummary(accountId, read, withProfile)
  const moved = JSON.stringify(player?.summary?.earned) !== JSON.stringify(read.earned)
  const due = moved || job.priority <= PRIORITY.manual || olderThan(player?.titlesAt ?? null, DAY_MS)
  return due ? [{ phase: 'titles', priority: job.priority }] : []
}

async function titles(accountId: string, job: PsnJob): Promise<NextJob[]> {
  const [player, stored] = await Promise.all([loadPsnPlayer(accountId), loadPsnGames(accountId)])
  const core = await fetchPsnTitles(accountId)
  const before = new Map(stored.map((s) => [s.game.titleId, s.game.lastTrophyAt]))
  const moved = core.length !== stored.length || core.some((g) => before.get(g.titleId) !== g.lastTrophyAt)
  await savePsnTitles(accountId, core)
  const next: NextJob[] = []
  // The played list only when needed: a game moved, or a day went by (play time grows without trophies).
  if (moved || olderThan(player?.enrichedAt ?? null, DAY_MS)) next.push({ phase: 'enrich', priority: job.priority })
  const delta = await psnDeltaCount(accountId, yearStart())
  if (delta.total > 0 || !player?.yearAt) next.push({ phase: 'recent', priority: job.priority })
  return next
}

/** Play data and art: a failure keeps the last pass's (tried again on the next sync), never the sync from moving on. */
async function enrich(accountId: string): Promise<NextJob[]> {
  try {
    const core = (await loadPsnGames(accountId)).map((s) => s.game)
    await savePsnEnrichment(accountId, await fetchPsnEnrichment(accountId, core))
  } catch (err) {
    if (!(err instanceof PsnBusyError)) console.error('[psnSync] enrichment', err)
  }
  return []
}

async function recent(accountId: string, job: PsnJob): Promise<NextJob[]> {
  const since = yearStart()
  const read = await readDelta(accountId, await psnDeltaGames(accountId, since, 'year', CHUNK))
  const left = await psnDeltaCount(accountId, since)
  if (left.year > 0) return [{ phase: 'recent', priority: job.priority }]
  await markPsnYearReady(accountId)
  if (left.total > 0) return [{ phase: 'history', priority: PRIORITY.history }]
  return read > 0 ? [{ phase: 'score', priority: PRIORITY.score }] : []
}

async function history(accountId: string): Promise<NextJob[]> {
  const read = await readDelta(accountId, await psnDeltaGames(accountId, yearStart(), 'rest', CHUNK))
  const left = await psnDeltaCount(accountId, yearStart())
  if (left.total > 0) return [{ phase: left.year > 0 ? 'recent' : 'history', priority: PRIORITY.history }]
  return read > 0 ? [{ phase: 'score', priority: PRIORITY.score }] : []
}

async function score(_accountId: string, job: PsnJob): Promise<NextJob[]> {
  return (await runScoreAfterSync(job.userId)) ? [] : [{ phase: 'score', priority: PRIORITY.score, delayMs: SCORE_RETRY_MS }]
}

/**
 * Reads and stores each game's trophies, 4 at once. The games read are kept even when one fails; then the job
 * fails (and is tried again later) so a game is never marked read without its trophies. How many were stored.
 */
async function readDelta(accountId: string, games: DeltaGame[]): Promise<number> {
  if (games.length === 0) return 0
  const player = await loadPsnPlayer(accountId)
  const language = player?.language ?? DEFAULT_LANGUAGE
  const results = await mapLimit(games, PARALLEL, async (d) => savePsnGameTrophies(accountId, await fetchPsnGame(accountId, d.game, d, language)))
  const failed = results.find((r) => r.status === 'rejected')
  // ponytail: a game Sony always refuses holds its account's delta until its job fails for good; skip it if ever seen.
  if (failed) throw (failed as PromiseRejectedResult).reason
  return results.length
}

let draining = false

/**
 * After PSN traffic (a page read, a link, a refresh): drains the queue once the answer is sent, one drain at a
 * time on this instance. Other instances drain too; a job never runs twice at once (psnQueue).
 */
export function kickPsnSync(): void {
  if (draining) return
  draining = true
  runLater(() => drainPsnQueue(runPsnJob, Date.now() + KICK_MS).finally(() => (draining = false)))
}

/** Asks for a sync of the user's PSN from `phase`, and starts draining after the answer. */
export async function requestPsnSync(userId: number | string, priority: number, phase: PsnPhase = 'summary'): Promise<void> {
  await enqueuePsn(userId, phase, priority)
  kickPsnSync()
}

/**
 * Linking (#179): the summary is read now (2 requests, after the search), so a hidden profile is refused at once
 * and the profile column has its numbers; `syncLinkedPsn` queues the rest once the link is saved.
 */
export async function readPsnOnLink(accountId: string, language = DEFAULT_LANGUAGE): Promise<void> {
  const { summary: read } = await fetchPsnSummary(accountId, null)
  await savePsnSummary(accountId, read, true)
  // The first sync reads the trophy texts in the reader's language.
  await setPsnLanguage(accountId, language)
}

/** The link is saved: the trophy list and the year next, first in the queue. */
export async function syncLinkedPsn(userId: number | string): Promise<void> {
  await requestPsnSync(userId, PRIORITY.link, 'titles')
}

/** Rows of accounts no user has linked any more (unlinked, relinked to another, a user deleted). */
export async function sweepPsnPlayers(): Promise<void> {
  await queryRows(`DELETE FROM psn_players p WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.psnaccountid = p.account_id)`)
}

/** The daily cron: a sync for every linked account seen in the last two weeks whose last check is older than 20 hours. */
export async function enqueueDuePsnSyncs(): Promise<number> {
  const rows = await queryRows<{ id: number }>(
    `INSERT INTO psn_sync_jobs (user_id, phase, priority)
     SELECT u.id, 'summary', $1 FROM users u LEFT JOIN psn_players p ON p.account_id = u.psnaccountid
      WHERE u.psnaccountid IS NOT NULL AND u.last_seen_at > now() - interval '14 days'
        AND (p.summary_at IS NULL OR p.summary_at < now() - interval '20 hours')
     ON CONFLICT (user_id, phase) WHERE status IN ('queued', 'running') DO NOTHING
     RETURNING user_id AS id`,
    [PRIORITY.cron],
  )
  return rows.length
}
