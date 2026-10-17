import type { PinnedAchievement } from '@/types/types'
import type { GameSource } from '@/types/steam'
import type { Translations } from '@/translations/en'
import { pinnedKey } from '@/utils/utils'
import { psnTrophyAnchor, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import { achievementAnchor } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'

/** A pinned achievement of any platform, in the one shape its tile draws. */
export type PinnedView = {
  key: string
  source: GameSource
  gameId: number
  gameTitle: string
  title: string
  description: string
  iconUrl: string | null
  earned: boolean
  /** Where it sits on its game's page; null for RA, which opens its detail modal instead. */
  anchor: string | null
  /** RA's points, Xbox's gamerscore or PSN's grade; null for Steam, which has none. */
  value: string | null
  valueClass: string
  /** Share of players who have it, 0–100, when known. */
  rarity: number | null
}

/**
 * A pinned achievement as its tile shows it. A hidden or secret one not yet
 * earned keeps its name and description concealed, as on its game's page.
 */
export function pinnedView(fav: PinnedAchievement, T: Translations): PinnedView {
  const base = { key: pinnedKey(fav), source: fav.source, gameId: fav.game_id, gameTitle: fav.game_title }
  if (fav.source === 'steam') {
    const a = fav.snapshot
    const concealed = a.hidden && !a.earned
    return {
      ...base,
      title: concealed ? T.steam.hiddenAchievement : a.title,
      description: concealed ? '' : a.description,
      iconUrl: a.badgeUrl || null,
      earned: a.earned,
      anchor: achievementAnchor(fav.steam_apiname),
      value: null,
      valueClass: '',
      rarity: a.globalPct ?? null,
    }
  }
  if (fav.source === 'psn') {
    const t = fav.snapshot
    const concealed = t.hidden && !t.earned
    const grade = { platinum: T.psn.platinum, gold: T.psn.gold, silver: T.psn.silver, bronze: T.psn.bronze }[t.type]
    return {
      ...base,
      title: concealed ? T.psn.hiddenTrophy : t.name,
      description: concealed ? T.psn.hiddenTrophyDesc : t.detail,
      iconUrl: t.iconUrl,
      earned: t.earned,
      anchor: psnTrophyAnchor(fav.psn_trophy_id),
      value: grade,
      valueClass: TROPHY_GRADE_COLOR[t.type],
      rarity: t.rarity ?? null,
    }
  }
  if (fav.source === 'xbox') {
    const a = fav.snapshot
    const concealed = a.secret && !a.unlocked
    return {
      ...base,
      title: concealed ? T.xbox.secretAchievement : a.name,
      description: concealed ? '' : a.description,
      iconUrl: a.iconUrl,
      earned: a.unlocked,
      anchor: xboxAchievementAnchor(fav.xbox_achievement_id),
      value: `${a.gamerscore} G`,
      valueClass: 'text-green-500',
      rarity: a.rarity ?? null,
    }
  }
  const a = fav.snapshot
  return {
    ...base,
    title: a.Title,
    description: a.Description,
    iconUrl: a.BadgeName ? `https://media.retroachievements.org/Badge/${a.BadgeName}.png` : null,
    earned: Boolean(a.DateEarned || a.DateEarnedHardcore),
    anchor: null,
    value: `${a.Points} pts`,
    valueClass: 'text-accent',
    rarity: fav.num_distinct_players > 0 ? (a.NumAwarded / fav.num_distinct_players) * 100 : null,
  }
}
