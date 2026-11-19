/**
 * Where a PSN sync stands, as a person reads it (#180, docs/psn-multi-account-pool.md §9): the stage, four steps
 * with their state, a real percentage, a rounded wait and the place in the queue, and what is wrong if anything.
 * Pure: `psnSnapshot.psnSyncState` gathers the facts from the database, this decides what they mean.
 *
 * - `syncing_core`: the trophy list is not stored yet (the library waits).
 * - `ready_partial`: trophies and library are there; the year (streak, heatmap) is still being read.
 * - `enriching`: the year is whole; play data or older games are still being read. Nothing waits on it.
 * - `ready`, and `private` (the profile hides its trophies).
 * `stale` (data an hour old or more) and `trouble` are overlays, never a broken state.
 */
export type PsnSyncStage = 'syncing_core' | 'ready_partial' | 'enriching' | 'ready' | 'private'
export type PsnStepState = 'done' | 'active' | 'waiting'
export type PsnSyncSteps = { trophies: PsnStepState; library: PsnStepState; playtime: PsnStepState; history: PsnStepState }
/** paused: Sony is not being read now (PSN_MODE=stale or no account can read); failing: a job keeps failing. */
export type PsnSyncTrouble = 'paused' | 'failing' | null

export type PsnSyncFacts = {
  player: { summaryAt: number | null; titlesAt: number | null; enrichedAt: number | null; yearAt: number | null; state: 'new' | 'ok' | 'private' } | null
  jobs: Array<{ phase: string; status: 'queued' | 'running'; error: string | null }>
  failedRecently: boolean
  ahead: number
  pending: { year: number; total: number; started: number }
  /** Calls a minute the sync may make (the usable accounts' background share). */
  callsPerMin: number
  paused: boolean
  syncedAt: number | null
  now: number
}

export type PsnSyncView = {
  stage: PsnSyncStage
  steps: PsnSyncSteps
  /** 0–100, from what is stored: never a timer. */
  progress: number
  /** Games with trophies, read and in all. */
  games: { read: number; total: number }
  /** A rough wait, null when nothing is left or nothing can move. */
  etaSeconds: number | null
  /** Others' jobs before the user's, when none of theirs runs. */
  position: number | null
  stale: boolean
  trouble: PsnSyncTrouble
}

/** Data this old is shown as it is, with a line saying how old. */
export const STALE_MS = 60 * 60 * 1000
/** Rough Sony requests per step: the core (summary + list), the play data (played list + 20 sets), a game, another user's job. */
const CALLS = { core: 2, playtime: 22, game: 2, job: 3 }

const has = (f: PsnSyncFacts, ...phases: string[]) => f.jobs.some((j) => phases.includes(j.phase))

function steps(f: PsnSyncFacts): PsnSyncSteps {
  const p = f.player
  const titles = Boolean(p?.titlesAt)
  return {
    trophies: p?.summaryAt ? 'done' : 'active',
    library: titles ? 'done' : p?.summaryAt ? 'active' : 'waiting',
    playtime: has(f, 'enrich') ? 'active' : titles ? 'done' : 'waiting',
    history: !titles ? 'waiting' : has(f, 'recent', 'history') || f.pending.total > 0 ? 'active' : p?.yearAt ? 'done' : 'waiting',
  }
}

function stage(f: PsnSyncFacts): PsnSyncStage {
  const p = f.player
  if (p?.state === 'private') return 'private'
  if (!p?.titlesAt) return 'syncing_core'
  if (!p.yearAt) return 'ready_partial'
  return f.jobs.length > 0 || f.pending.total > 0 ? 'enriching' : 'ready'
}

function progress(f: PsnSyncFacts, at: PsnSyncStage, read: number): number {
  if (at === 'ready' || at === 'private') return 100
  if (!f.player?.titlesAt) return f.player?.summaryAt ? 10 : 0
  const share = f.pending.started > 0 ? read / f.pending.started : 1
  return Math.min(99, Math.round(30 + 70 * share))
}

function eta(f: PsnSyncFacts, at: PsnSyncStage): number | null {
  if (at === 'ready' || at === 'private' || f.callsPerMin <= 0) return null
  const calls =
    (f.player?.titlesAt ? 0 : CALLS.core) + (has(f, 'enrich') ? CALLS.playtime : 0) + f.pending.total * CALLS.game + f.ahead * CALLS.job
  return Math.max(5, Math.round((calls / f.callsPerMin) * 60))
}

export function describePsnSync(f: PsnSyncFacts): PsnSyncView {
  const at = stage(f)
  const read = Math.max(0, f.pending.started - f.pending.total)
  const busy = at !== 'ready' && at !== 'private'
  return {
    stage: at,
    steps: steps(f),
    progress: progress(f, at, read),
    games: { read, total: f.pending.started },
    etaSeconds: eta(f, at),
    position: busy && f.ahead > 0 && !f.jobs.some((j) => j.status === 'running') ? f.ahead + 1 : null,
    stale: f.syncedAt !== null && f.now - f.syncedAt >= STALE_MS,
    trouble: f.paused ? 'paused' : f.failedRecently || f.jobs.some((j) => j.error !== null && j.error !== 'busy') ? 'failing' : null,
  }
}
