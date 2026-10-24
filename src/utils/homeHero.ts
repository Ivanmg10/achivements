import type { RecentFeedItem } from '@/utils/steamFeed'
import type { GameSource } from '@/types/steam'
import { steamAssetUrl } from '@/lib/steamClient'
import { psnBackdrop } from '@/utils/psnTitles'
import { xboxBackdrop } from '@/utils/xboxTitles'

/** What the home's cover shows of the game played last. */
export type HomeHero = {
  source: GameSource
  id: number
  title: string
  console: string
  /** The widest art there is for it (Steam's hero, PSN's backdrop), else its icon. */
  image: string | null
  earned: number
  total: number
  /** 0–100. */
  pct: number
  lastPlayed: string | null
}

/** The game the cover shows: the first of the recently played feed (a collection shows its newest game). */
export function homeHeroOf(item: RecentFeedItem | undefined): HomeHero | null {
  if (!item) return null
  if (item.source === 'ra') {
    const g = item.game
    const total = g.NumPossibleAchievements
    const earned = g.NumAchievedHardcore || g.NumAchieved
    return {
      source: 'ra',
      id: g.GameID,
      title: g.Title,
      console: g.ConsoleName,
      image: g.ImageIcon ? `https://retroachievements.org${g.ImageIcon}` : null,
      earned,
      total,
      pct: total ? Math.round((earned / total) * 100) : 0,
      lastPlayed: item.lastPlayed,
    }
  }
  const g = item.source === 'psnCollection' ? item.games[0] : item.game
  if (!g) return null
  const image =
    item.source === 'steam' ? steamAssetUrl(g.id, 'hero')
    : item.source === 'xbox' ? xboxBackdrop(g as Parameters<typeof xboxBackdrop>[0])
    : psnBackdrop(g as Parameters<typeof psnBackdrop>[0])
  return {
    source: item.source === 'psnCollection' ? 'psn' : item.source,
    id: g.id,
    title: g.title,
    console: g.consoleName,
    image,
    earned: g.numAwarded,
    total: g.maxPossible,
    pct: Math.round(g.pctWon),
    lastPlayed: item.lastPlayed,
  }
}
