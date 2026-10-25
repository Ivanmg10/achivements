import type { RecentFeedItem } from '@/utils/steamFeed'
import type { GameSource } from '@/types/steam'
import { steamAssetUrl } from '@/lib/steamClient'
import { psnBackdrop } from '@/utils/psnTitles'

/** What the home's cover shows of the game played last. */
export type HomeHero = {
  source: GameSource
  id: number
  title: string
  console: string
  /** The wide art it has, best first (Steam's hero then its store header, PSN's backdrop, then its box art): each one may fail to load, so the cover tries them in turn. */
  art: string[]
  /** Its own small picture, the one a list shows. */
  icon: string | null
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
      art: [],
      icon: g.ImageIcon ? `https://retroachievements.org${g.ImageIcon}` : null,
      earned,
      total,
      pct: total ? Math.round((earned / total) * 100) : 0,
      lastPlayed: item.lastPlayed,
    }
  }
  const g = item.source === 'psnCollection' ? item.games[0] : item.game
  if (!g) return null
  const art =
    item.source === 'steam' ? [steamAssetUrl(g.id, 'hero'), steamAssetUrl(g.id, 'header')]
    : item.source === 'xbox' ? []
    : [psnBackdrop(g as Parameters<typeof psnBackdrop>[0])]
  return {
    source: item.source === 'psnCollection' ? 'psn' : item.source,
    id: g.id,
    title: g.title,
    console: g.consoleName,
    art: art.filter(Boolean),
    icon: item.source === 'steam' ? steamAssetUrl(g.id, 'cover') : g.imageIcon || null,
    earned: g.numAwarded,
    total: g.maxPossible,
    pct: Math.round(g.pctWon),
    lastPlayed: item.lastPlayed,
  }
}
