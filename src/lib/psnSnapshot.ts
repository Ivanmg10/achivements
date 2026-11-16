import { withEnrichment, type PsnSummary } from '@/lib/psnClient'
import { PRIVATE_CODE, PsnError, PsnSyncing } from '@/lib/psnErrors'
import { psnJobsOf, PRIORITY, type PsnPhase } from '@/lib/psnQueue'
import {
  loadPsnEarnedSince,
  loadPsnGame,
  loadPsnGames,
  loadPsnGameTrophies,
  loadPsnLatestGames,
  loadPsnPlayer,
  markPsnWanted,
  psnDeltaCount,
  setPsnLanguage,
  type PsnPlayer,
} from '@/lib/psnStore'
import { requestPsnSync, yearStart } from '@/lib/psnSync'
import { wantsFresh } from '@/lib/wantsFresh'
import type { PsnGameProgress, PsnRecentTrophy, PsnTrophy, PsnTrophyGroup } from '@/types/psn'

/**
 * What PSN pages read (#179): the stored snapshot (psnStore), never Sony. With nothing stored yet the reader
 * throws PsnSyncing (the route answers 202) and a sync is queued; data older than SYNC_EVERY_MS is answered as
 * it is and a sync queued after it. The worker (psnSync) does the reading, so a page waits on the database only.
 */

/** A page's data older than this asks for a sync (the summary first: 1 request when nothing moved). */
export const SYNC_EVERY_MS = 15 * 60 * 1000
/** The refresh button (or POST /api/psn/refresh) reads Sony again at most this often. */
export const REFRESH_MS = 10 * 60 * 1000
/** How many of the latest games the profile column's "recent trophies" look through. */
const LATEST_GAMES = 3
const YEAR_DAYS = 366
const DAY_MS = 24 * 60 * 60 * 1000

/** When Sony was last asked about the account (ms): the summary is the check, the list follows when it moved. */
export const lastChecked = (p: PsnPlayer) => Math.max(p.summaryAt ?? 0, p.titlesAt ?? 0) || null

/**
 * The account's snapshot, when its list is stored: else a sync is queued and PsnSyncing thrown. A hidden profile
 * throws as Sony would (403), checked again every SYNC_EVERY_MS. An old one, or the refresh button, queues a sync.
 */
async function ready(accountId: string, userId: string, language?: string): Promise<PsnPlayer> {
  const player = await loadPsnPlayer(accountId)
  // The next syncs read trophy texts in the language its readers use.
  // ponytail: texts already stored stay in the old language until their game moves or is opened; re-read the year if it matters.
  if (language && player && player.language !== language) await setPsnLanguage(accountId, language)
  if (!player?.titlesAt && player?.state !== 'private') {
    // Linked a moment ago (the summary is stored): the list is what is missing, and is likely queued already.
    await requestPsnSync(userId, PRIORITY.first, player?.summary ? 'titles' : 'summary')
    throw new PsnSyncing()
  }
  const age = Date.now() - (lastChecked(player) ?? 0)
  const manual = age >= REFRESH_MS && (await wantsFresh())
  if (manual || age >= SYNC_EVERY_MS) await requestPsnSync(userId, manual ? PRIORITY.manual : PRIORITY.cron)
  if (player.state === 'private') throw new PsnError('private (stored)', PRIVATE_CODE)
  return player
}

/** The headline numbers, with when Sony was last checked and when the refresh button may check again. */
export async function psnSummary(accountId: string, userId: string): Promise<PsnSummary> {
  const player = await ready(accountId, userId)
  if (!player.summary) throw new PsnSyncing()
  const syncedAt = lastChecked(player)
  return { ...player.summary, games: player.games, syncedAt, nextSyncAt: syncedAt === null ? null : syncedAt + REFRESH_MS }
}

/** The trophy list alone, most recent trophy first. */
export async function psnTitlesCore(accountId: string, userId: string): Promise<PsnGameProgress[]> {
  await ready(accountId, userId)
  return (await loadPsnGames(accountId)).map((s) => s.game)
}

/** Every game with its play data, art and completion date, most recently played first. */
export async function psnLibrary(accountId: string, userId: string): Promise<PsnGameProgress[]> {
  const player = await ready(accountId, userId)
  const games = await loadPsnGames(accountId)
  const completed = new Map(games.map((s) => [s.game.titleId, s.completedAt]))
  return withEnrichment(
    games.map((s) => s.game),
    player.enrichment,
    (g) => completed.get(g.titleId) ?? null,
  )
}

/** A game of the account's by Sony's ID, or null when it is not in their list. */
export async function findPsnGame(accountId: string, titleId: string, userId: string): Promise<PsnGameProgress | null> {
  await ready(accountId, userId)
  return (await loadPsnGame(accountId, titleId))?.game ?? null
}

/**
 * One game's trophies and groups, texts in `language`; null when it is not in the list. Never read (or read
 * before its last trophy): the game is asked for first in the queue and, never read, PsnSyncing. Read but in
 * another language, or before a newer trophy: answered as stored, and asked for anew.
 */
export async function psnGame(accountId: string, titleId: string, userId: string, language: string): Promise<{ trophies: PsnTrophy[]; groups: PsnTrophyGroup[] } | null> {
  await ready(accountId, userId, language)
  const stored = await loadPsnGame(accountId, titleId)
  if (!stored) return null
  const data = await loadPsnGameTrophies(accountId, titleId, language)
  const started = stored.game.numAwarded > 0
  const usable = data && (!started || data.trophiesAt !== null)
  if (!usable || data.trophiesAt !== stored.game.lastTrophyAt || !data.languages.includes(language)) {
    await markPsnWanted(accountId, titleId)
    await requestPsnSync(userId, PRIORITY.manual, 'history')
  }
  if (!usable) throw new PsnSyncing()
  return { trophies: data.trophies, groups: data.groups }
}

/** The latest trophies, however long ago, from the last few games played: the profile column. */
export async function psnLatestTrophies(accountId: string, userId: string, language: string): Promise<PsnRecentTrophy[]> {
  await ready(accountId, userId, language)
  const games = await loadPsnLatestGames(accountId, LATEST_GAMES)
  if (games.some((s) => s.trophiesAt === null)) return waitFor(userId, 'recent')
  return loadPsnEarnedSince(accountId, '', language, games.map((s) => s.game.titleId))
}

/** Every trophy earned in the last `days` days (at most a year), newest first: 202 until the year is first whole. */
export async function psnRecentTrophies(accountId: string, days: number, userId: string, language: string): Promise<PsnRecentTrophy[]> {
  const player = await ready(accountId, userId, language)
  if (player.yearAt === null) return waitFor(userId, 'recent')
  const since = new Date(Date.now() - Math.min(days, YEAR_DAYS) * DAY_MS).toISOString()
  return loadPsnEarnedSince(accountId, since, language)
}

/** The sync is on its way (a chain that died is started again from `phase`): the route answers 202. */
async function waitFor(userId: string, phase: PsnPhase): Promise<never> {
  await requestPsnSync(userId, PRIORITY.first, phase)
  throw new PsnSyncing()
}

export type PsnSyncState = {
  /** new: nothing stored yet; syncing: a sync is queued or running; ready; private: Sony says the trophies are hidden. */
  state: 'new' | 'syncing' | 'ready' | 'private'
  syncedAt: number | null
  nextSyncAt: number | null
  /** Games whose trophies wait to be read: in the year, and in all. */
  pending: { year: number; total: number }
  yearReady: boolean
  jobs: Array<{ phase: PsnPhase; status: 'queued' | 'running' }>
}

/** Where the account's sync stands, for /api/psn/status and the bootstrap. Database only; queues nothing. */
export async function psnSyncState(accountId: string, userId: string): Promise<PsnSyncState> {
  const [player, jobs] = await Promise.all([loadPsnPlayer(accountId), psnJobsOf(userId)])
  const pending = player?.titlesAt ? await psnDeltaCount(accountId, yearStart()) : { year: 0, total: 0 }
  const syncedAt = player ? lastChecked(player) : null
  const state = player?.state === 'private' ? 'private' : !player?.titlesAt ? 'new' : jobs.length ? 'syncing' : 'ready'
  return {
    state,
    syncedAt,
    nextSyncAt: syncedAt === null ? null : syncedAt + REFRESH_MS,
    pending,
    yearReady: Boolean(player?.yearAt),
    jobs: jobs.map(({ phase, status }) => ({ phase, status })),
  }
}
