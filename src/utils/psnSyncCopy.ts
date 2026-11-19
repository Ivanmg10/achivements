import type { Translations } from '@/translations/en'
import { relativeTime } from '@/utils/dates'
import type { PsnSyncView } from '@/utils/psnSyncStage'

type Sync = Pick<PsnSyncView, 'stage' | 'trouble' | 'stale' | 'position' | 'games' | 'etaSeconds'> & { syncedAt: number | null }
type Copy = Translations['psn']['sync']

/** A wait this long is not promised in minutes (docs/psn-multi-account-pool.md §9.5). */
const LONG_WAIT_S = 30 * 60

/**
 * The one line that says where a PSN sync stands (#180), in plain words: what is wrong first (paused, failing),
 * then old data, then the stage. Null when there is nothing to say (ready and fresh).
 */
export function psnSyncMessage(sync: Sync, copy: Copy, lang: string): string | null {
  if (sync.trouble === 'paused') return copy.paused
  if (sync.trouble === 'failing') return copy.failing
  if (sync.stage === 'syncing_core') return sync.position ? copy.queued.replace('{n}', String(sync.position)) : copy.core
  if (sync.stale && sync.syncedAt !== null) return copy.stale.replace('{when}', relativeTime(new Date(sync.syncedAt).toISOString(), lang, 'long'))
  if (sync.stage === 'enriching' && sync.games.read < sync.games.total) {
    return copy.history.replace('{read}', sync.games.read.toLocaleString(lang)).replace('{total}', sync.games.total.toLocaleString(lang))
  }
  if (sync.stage === 'ready_partial' || sync.stage === 'enriching') return copy.partial
  return null
}

/** The wait, rounded: never an exact promise. Null when nothing is left. */
export function psnSyncEta(etaSeconds: number | null, copy: Copy, lang: string): string | null {
  if (etaSeconds === null) return null
  if (etaSeconds < 60) return copy.etaSeconds
  if (etaSeconds > LONG_WAIT_S) return copy.etaLong
  return copy.etaMinutes.replace('{n}', Math.ceil(etaSeconds / 60).toLocaleString(lang))
}

/** A countdown as m:ss (8:42). */
export function countdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
