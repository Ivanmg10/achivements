import { classifySteamGame } from '@/utils/steamFeed'
import { gameKey } from '@/utils/gameRef'
import type { RetroAchievementsGameCompleted } from '@/types/types'
import type { GameSource, SteamGameProgress } from '@/types/steam'

/**
 * A game with every achievement, from either platform, in one shape — what
 * the "Mastered & Completed" card lists and what its custom order sorts.
 */
export type PerfectGame = {
  /** "ra:123" / "steam:620" — the id the saved order stores. */
  key: string
  source: GameSource
  id: number
  title: string
  imageUrl?: string
  subtitle: string
  /** RA only: mastered in hardcore rather than completed in softcore. */
  hardcore: boolean
}

/**
 * Every perfect game across both platforms. An RA game can appear twice
 * (softcore and hardcore rows); hardcore wins, as the card's counts do.
 */
export function buildPerfectGames(
  raGames: RetroAchievementsGameCompleted[],
  steamGames: SteamGameProgress[] = [],
): PerfectGame[] {
  const byId = new Map<number, PerfectGame>()
  for (const g of raGames) {
    if (parseFloat(g.PctWon) < 1) continue
    const hardcore = g.HardcoreMode === '1'
    if (!hardcore && byId.get(g.GameID)?.hardcore) continue
    byId.set(g.GameID, {
      key: gameKey('ra', g.GameID),
      source: 'ra',
      id: g.GameID,
      title: g.Title,
      imageUrl: g.ImageIcon ? `https://retroachievements.org${g.ImageIcon}` : undefined,
      subtitle: g.ConsoleName,
      hardcore,
    })
  }

  const steam: PerfectGame[] = steamGames
    .filter((g) => classifySteamGame(g) === 'completed')
    .map((g) => ({
      key: gameKey('steam', g.id),
      source: 'steam',
      id: g.id,
      title: g.title,
      imageUrl: g.imageIcon || undefined,
      subtitle: g.consoleName,
      hardcore: false,
    }))

  return [...byId.values(), ...steam]
}

/** Counts for the card's header: RA hardcore, RA softcore, Steam. */
export function countPerfectGames(games: PerfectGame[]): { hc: number; sc: number; steam: number } {
  return {
    hc: games.filter((g) => g.source === 'ra' && g.hardcore).length,
    sc: games.filter((g) => g.source === 'ra' && !g.hardcore).length,
    steam: games.filter((g) => g.source === 'steam').length,
  }
}

/**
 * The user's saved order first, then whatever it does not name, by title —
 * so a newly perfected game shows up without having to be dragged into place.
 */
export function applyPerfectOrder(games: PerfectGame[], savedOrder: string[]): PerfectGame[] {
  const byKey = new Map(games.map((g) => [g.key, g]))
  const ordered: PerfectGame[] = []
  const seen = new Set<string>()

  for (const key of savedOrder) {
    const g = byKey.get(key)
    if (g && !seen.has(key)) {
      ordered.push(g)
      seen.add(key)
    }
  }

  const rest = games.filter((g) => !seen.has(g.key)).sort((a, b) => a.title.localeCompare(b.title))
  return [...ordered, ...rest]
}
