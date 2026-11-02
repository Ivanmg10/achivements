import type { RecentFeedItem } from '@/utils/steamFeed'
import type { GameSource } from '@/types/steam'
import { steamAssetUrl } from '@/lib/steamAssets'
import type { PsnGameProgress } from '@/types/psn'

/** Art narrower than a console's 8:7 screen, or flatter than this, does not survive the cover's crop. */
const ASPECT_MIN = 8 / 7
const ASPECT_MAX = 4
/** How far the cover may stretch a picture before it reads as blurred. */
const MAX_UPSCALE = 2

export const isWideEnough = (aspect: number) => aspect >= ASPECT_MIN && aspect <= ASPECT_MAX

/**
 * Whether a loaded picture may be the cover's background, in a box of this size.
 * The box counts: a 460 px store header is fine on a phone and a smear at 2560 px.
 */
export function heroArtFits(width: number, height: number, boxWidth: number, boxHeight: number): boolean {
  if (!width || !height) return false
  return isWideEnough(width / height) && width * MAX_UPSCALE >= boxWidth && height * MAX_UPSCALE >= boxHeight
}

/** A loaded picture for the cover: right for this box, too small but better than no background, or never (a portrait is not cropped into one). */
export type ArtVerdict = 'fit' | 'soft' | 'bad'

export function artVerdict(width: number, height: number, boxWidth: number, boxHeight: number): ArtVerdict {
  if (!width || !height || !isWideEnough(width / height)) return 'bad'
  return heroArtFits(width, height, boxWidth, boxHeight) ? 'fit' : 'soft'
}

/** What the home's cover shows of the game played last. */
export type HomeHero = {
  source: GameSource
  id: number
  title: string
  console: string
  /**
   * The wide art it has, best first; the cover tries each in turn, as any may
   * fail to load or not pass `heroArtFits`. Before these comes what the game's
   * own reads add (`useGameInsights`: IGDB's for RA and Xbox, then RA's in-game
   * screenshot and title screen). Steam: library hero, then store header. PSN: its
   * backdrop, never a box art, which is portrait. If none fits, the first one too
   * small for the box (`artVerdict`, the user's call: the cover is never just a
   * box art while a wide picture exists). With none at all, a poster over the
   * game's colour: the box art those reads add (RA's own, Xbox's from IGDB), then
   * `icon`. Last, that colour alone (a neutral grey if it cannot be read).
   */
  art: string[]
  /** Its own picture, whole: Steam's and PSN's box art, RA's and Xbox's tile. */
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
  const psn = item.source === 'psn' || item.source === 'psnCollection' ? (g as PsnGameProgress) : null
  return {
    source: item.source === 'psnCollection' ? 'psn' : item.source,
    id: g.id,
    title: g.title,
    console: g.consoleName,
    art: item.source === 'steam' ? [steamAssetUrl(g.id, 'hero'), steamAssetUrl(g.id, 'header')] : psn?.heroUrl ? [psn.heroUrl] : [],
    icon: item.source === 'steam' ? steamAssetUrl(g.id, 'cover') : psn?.coverUrl || g.imageIcon || null,
    earned: g.numAwarded,
    total: g.maxPossible,
    pct: Math.round(g.pctWon),
    lastPlayed: item.lastPlayed,
  }
}
