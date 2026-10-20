import type { GameSource } from '@/types/steam'
import type { RecentAchievement } from '@/types/types'
import { achievementBadgeUrl } from '@/utils/utils'

/** How many achievements a showcase holds. */
export const SHOWCASE_MAX = 5

/**
 * An earned achievement as the showcase keeps it: one shape for every platform.
 * `achievementKey` is RA's achievement id, Steam's apiname, PSN's trophy id or
 * Xbox's achievement id, as text.
 */
export type ShowcaseEntry = {
  source: GameSource
  gameId: number
  achievementKey: string
  gameTitle: string
  title: string
  description: string | null
  badge: string | null
  /** When it was earned (ISO); the showcase takes earned achievements only. */
  earnedAt: string
}

export type ShowcaseItem = ShowcaseEntry & { id: number }

const SOURCES: GameSource[] = ['ra', 'steam', 'psn', 'xbox']
const DAY = 86400000

export const showcaseKey = (e: Pick<ShowcaseEntry, 'source' | 'gameId' | 'achievementKey'>) => `${e.source}:${e.gameId}:${e.achievementKey}`

const text = (v: unknown, max: number): string | null => (typeof v === 'string' && v.trim() && v.length <= max ? v.trim() : null)

/**
 * An entry from a request, checked: known platform, sane ids and lengths, an
 * https badge, and an earned date that is a date and not in the future. Null
 * when anything is off. That it was really earned is the client's word
 * (ponytail: checked against the platform only if lying here ever matters).
 */
export function parseShowcaseEntry(v: unknown, now: number = Date.now()): ShowcaseEntry | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const source = SOURCES.find((s) => s === o.source)
  const gameId = o.gameId
  const achievementKey = text(o.achievementKey, 100)
  const gameTitle = text(o.gameTitle, 200)
  const title = text(o.title, 200)
  const description = o.description == null || o.description === '' ? null : text(o.description, 1000)
  const badge = o.badge == null || o.badge === '' ? null : text(o.badge, 500)
  const earnedAt = typeof o.earnedAt === 'string' ? Date.parse(o.earnedAt) : NaN
  if (!source || !Number.isInteger(gameId) || (gameId as number) <= 0 || (gameId as number) > 2147483647) return null
  if (!achievementKey || !gameTitle || !title) return null
  if (o.description != null && o.description !== '' && description === null) return null
  if (badge !== null && !badge.startsWith('https://')) return null
  if (o.badge != null && o.badge !== '' && badge === null) return null
  if (Number.isNaN(earnedAt) || earnedAt > now + DAY) return null
  return { source, gameId: gameId as number, achievementKey, gameTitle, title, description, badge, earnedAt: new Date(earnedAt).toISOString() }
}

/** One of the year's unlocks (any platform) as a showcase entry; null without a key to tell it apart. */
export function showcaseFromUnlock(a: RecentAchievement): ShowcaseEntry | null {
  const source = a.Source ?? 'ra'
  const achievementKey = a.Key ?? (source === 'ra' ? String(a.AchievementID) : null)
  const at = Date.parse(a.Date.includes('T') ? a.Date : a.Date.replace(' ', 'T'))
  if (!achievementKey || Number.isNaN(at)) return null
  return {
    source,
    gameId: a.GameID,
    achievementKey,
    gameTitle: a.GameTitle,
    title: a.Title,
    description: a.Description || null,
    badge: achievementBadgeUrl(a) ?? null,
    earnedAt: new Date(at).toISOString(),
  }
}

/** An RA achievement as a showcase entry, if it was earned (hardcore first); null otherwise. */
export function raShowcaseEntry(
  a: { ID: number; Title: string; Description?: string | null; BadgeName?: string | null; DateEarned?: string | null; DateEarnedHardcore?: string | null },
  gameId: number,
  gameTitle: string,
): ShowcaseEntry | null {
  const earned = a.DateEarnedHardcore || a.DateEarned
  const at = earned ? Date.parse(earned.includes('T') ? earned : earned.replace(' ', 'T')) : NaN
  if (Number.isNaN(at)) return null
  return {
    source: 'ra',
    gameId,
    achievementKey: String(a.ID),
    gameTitle,
    title: a.Title,
    description: a.Description || null,
    badge: a.BadgeName ? `https://media.retroachievements.org/Badge/${a.BadgeName}.png` : null,
    earnedAt: new Date(at).toISOString(),
  }
}

/**
 * One achievement of a game in the showcase picker: earned ones carry their
 * `entry` (what the showcase would keep); the rest are shown, greyed, to see
 * what is left. `concealed` is a hidden one not yet earned: no name or badge.
 */
export type ShowcaseChoice = {
  key: string
  title: string
  description: string | null
  badge: string | null
  earnedAt: string | null
  concealed: boolean
  entry: ShowcaseEntry | null
}

type ChoiceInput = {
  key: string
  title: string
  description?: string | null
  badge?: string | null
  earnedAt?: string | null
  hidden?: boolean
}

const isoOf = (d: string | null | undefined) => {
  if (!d) return null
  const t = Date.parse(d.includes('T') ? d : d.replace(' ', 'T'))
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

/** A game's achievements as picker choices, earned first (newest first), then the rest in the game's order. */
export function showcaseChoices(source: ShowcaseEntry['source'], gameId: number, gameTitle: string, list: ChoiceInput[]): ShowcaseChoice[] {
  const choices = list.map((a) => {
    const earnedAt = isoOf(a.earnedAt)
    const concealed = Boolean(a.hidden) && !earnedAt
    return {
      key: a.key,
      title: a.title,
      description: concealed ? null : a.description || null,
      badge: concealed ? null : a.badge || null,
      earnedAt,
      concealed,
      entry: earnedAt
        ? { source, gameId, achievementKey: a.key, gameTitle, title: a.title, description: a.description || null, badge: a.badge || null, earnedAt }
        : null,
    }
  })
  const earned = choices.filter((c) => c.earnedAt).sort((a, b) => b.earnedAt!.localeCompare(a.earnedAt!))
  return [...earned, ...choices.filter((c) => !c.earnedAt)]
}
