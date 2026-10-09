import type { CategoryGame } from '@/hooks/useGamesByCategory'
import type { GameSource, SteamGameProgress } from '@/types/steam'
import type { PsnGameProgress } from '@/types/psn'
import { PSN_PLATFORM } from '@/utils/psnMappers'

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
  /** RA: image path on retroachievements.org. Steam: library icon URL (fallback art). PSN: icon URL. */
  imageRef: string
  /** 0–100, or null when there is no progress to show (want-to-play, unknown). */
  pct: number | null
}

/** Placeholders while a list loads, before its width is known. */
export const PREVIEW_COUNT = 3

/**
 * Furthest along first: a preview shows what is closest to done. Games with
 * no progress to tell (want to play) keep their order, after the rest.
 */
function byProgress(list: PreviewGame[]): PreviewGame[] {
  return [...list].sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1))
}

export function raPreviewGames(games: CategoryGame[], count = PREVIEW_MAX): PreviewGame[] {
  return byProgress(games.map((g): PreviewGame => {
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
  })).slice(0, count)
}

export function steamPreviewGames(games: SteamGameProgress[], count = PREVIEW_MAX): PreviewGame[] {
  return byProgress(games.map((g): PreviewGame => ({
    key: `steam:${g.id}`,
    source: 'steam',
    id: g.id,
    title: g.title,
    subtitle: 'Steam',
    imageRef: g.imageIcon,
    pct: g.achievementsLoaded && g.maxPossible > 0 ? g.pctWon : null,
  }))).slice(0, count)
}

export function psnPreviewGames(games: PsnGameProgress[], count = PREVIEW_MAX): PreviewGame[] {
  return byProgress(games.map((g): PreviewGame => ({
    key: `psn:${g.id}`,
    source: 'psn',
    id: g.id,
    title: g.title,
    subtitle: PSN_PLATFORM,
    imageRef: g.imageIcon,
    pct: g.pctWon,
  }))).slice(0, count)
}

// ponytail: measured from the current layout (bar + page header above the
// first section, a section's title row and "show all" button, the gap between
// sections); retune if those change.
const PREVIEW_CARD = { minWidth: 300, height: 76, gap: 10 }
const PAGE_RESERVE = 176
const SECTION_RESERVE = 145
const MAX_COLUMNS = 8
const MAX_ROWS = 8
/** The most a preview can ask for. */
export const PREVIEW_MAX = MAX_COLUMNS * MAX_ROWS

/** Columns of preview cards that fit a width; one on a phone. */
export function previewColumns(width: number): number {
  if (width < 640) return 1
  return Math.min(MAX_COLUMNS, Math.max(1, Math.floor((width + PREVIEW_CARD.gap) / (PREVIEW_CARD.minWidth + PREVIEW_CARD.gap))))
}

/**
 * How many games each folded section previews, so the previews together fill
 * the screen's height down to the bottom: the rows that fit are shared out,
 * at least one each, and a section with fewer games than its share hands the
 * rest to the others (RA, Steam, and PSN or Xbox when they arrive). A phone
 * always gets three per section.
 */
export function previewCounts(columns: number, viewportHeight: number, gameCounts: number[]): number[] {
  if (columns <= 1) return gameCounts.map(() => 3)
  const rowHeight = PREVIEW_CARD.height + PREVIEW_CARD.gap
  let free = Math.floor((viewportHeight - PAGE_RESERVE - SECTION_RESERVE * gameCounts.length + PREVIEW_CARD.gap) / rowHeight)
  const need = gameCounts.map((n) => Math.min(MAX_ROWS, Math.max(1, Math.ceil(n / columns))))
  const rows = need.map(() => 1)
  free -= rows.length
  // Water-fill: one more row at a time to whoever still has games to show.
  while (free > 0) {
    const open = rows.map((r, i) => (r < need[i] ? i : -1)).filter((i) => i >= 0)
    if (open.length === 0) break
    for (const i of open) {
      if (free === 0) break
      rows[i]++
      free--
    }
  }
  return rows.map((r) => r * columns)
}
