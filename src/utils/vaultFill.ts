import type { FillPlatform, FillStatus } from '@/lib/scoreRefresh'
import type { GameSource } from '@/types/steam'
import type { Translations } from '@/translations/en'

export type FillProgress = {
  /** A fill is under way: show "calculating" rather than a level. */
  active: boolean
  read: number
  total: number
  /** 0–100, over the platforms being read (Xbox and failed ones left out). */
  pct: number
}

/**
 * How far a user's Vault Points fill has got, for the screens. Xbox is left
 * out of the count (its estimate is the settled state) and so are platforms
 * that failed: neither will move the bar.
 */
export function fillProgress(status: FillStatus | null | undefined): FillProgress {
  if (!status || status.complete) return { active: false, read: 0, total: 0, pct: 100 }
  let read = 0
  let total = 0
  for (const [source, p] of Object.entries(status.platforms)) {
    if (!p || source === 'xbox' || p.state === 'error') continue
    read += p.read + (p.skipped ?? 0)
    total += p.total
  }
  return { active: true, read, total, pct: total > 0 ? Math.min(99, Math.floor((read / total) * 100)) : 0 }
}


const NAMES: Record<GameSource, string> = { ra: 'RetroAchievements', steam: 'Steam', psn: 'PlayStation', xbox: 'Xbox' }

/**
 * What to tell the user about one platform's fill, or null when the bar says
 * it all: how to fix a private profile or a refused key, that a busy or
 * silent platform is retried on its own, and that Xbox fills in slowly.
 */
export function fillMessage(source: GameSource, p: FillPlatform, t: Translations['rankings']): string | null {
  const name = NAMES[source]
  if (p.error === 'private') return source === 'steam' ? t.fillPrivateSteam : source === 'psn' ? t.fillPrivatePsn : t.fillPrivate.replace('{platform}', name)
  if (p.error === 'key') return t.fillKey
  if (p.error === 'busy') return t.fillBusy.replace('{platform}', name)
  if (p.error === 'unavailable') return t.fillUnavailable.replace('{platform}', name)
  if (p.state === 'estimated') return t.fillXbox
  return null
}
