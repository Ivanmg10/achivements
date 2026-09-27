import type { CategoryGame } from '@/hooks/useGamesByCategory'
import type { GameSource, SteamGameProgress } from '@/types/steam'

/**
 * A game shown in a folded section's preview: enough to draw a small card
 * that links to the game, from either platform.
 */
export type PreviewGame = {
  key: string
  source: GameSource
  id: number
  title: string
  subtitle: string
  /** RA: image path on retroachievements.org. Steam: library icon URL (fallback art). */
  imageRef: string
  /** 0–100, or null when there is no progress to show (want-to-play, unknown). */
  pct: number | null
}

export const PREVIEW_COUNT = 3

export function raPreviewGames(games: CategoryGame[], count = PREVIEW_COUNT): PreviewGame[] {
  return games.slice(0, count).map((g) => {
    const id = 'GameID' in g && g.GameID ? g.GameID : (g as { ID: number }).ID
    const pctWon = 'PctWon' in g ? parseFloat(g.PctWon) : NaN
    return {
      key: `ra:${id}`,
      source: 'ra',
      id,
      title: g.Title,
      subtitle: g.ConsoleName,
      imageRef: g.ImageIcon,
      pct: Number.isFinite(pctWon) ? Math.min(pctWon * 100, 100) : null,
    }
  })
}

export function steamPreviewGames(games: SteamGameProgress[], count = PREVIEW_COUNT): PreviewGame[] {
  return games.slice(0, count).map((g) => ({
    key: `steam:${g.id}`,
    source: 'steam',
    id: g.id,
    title: g.title,
    subtitle: 'Steam',
    imageRef: g.imageIcon,
    pct: g.achievementsLoaded && g.maxPossible > 0 ? g.pctWon : null,
  }))
}
