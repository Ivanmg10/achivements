import { classifySteamGame } from '@/utils/steamFeed'
import { gameKey } from '@/utils/gameRef'
import type { RetroAchievementsGameCompleted, UserAward } from '@/types/types'
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

/** A game at 100%, with when it got there, for the podium of the latest ones. */
export type LatestPerfect = {
  key: string
  source: GameSource
  id: number
  title: string
  subtitle: string
  /** RA icon, the fallback while (or if) the box art does not load. */
  iconUrl?: string
  /** ISO-ish date string; for Steam the last session, the closest it reports. */
  date: string
  hardcore: boolean
}

/**
 * The most recent games taken to 100%, both platforms, newest first. RA dates
 * come from its mastery and completion awards; Steam has no completion date,
 * so a perfect game's last session stands in for it (for a finished game, the
 * session that finished it). One entry per RA game: a mastery after an
 * earlier completion is the same game, at its latest date.
 */
export function latestPerfects(
  awards: UserAward[] = [],
  steamGames: SteamGameProgress[] = [],
  count = 3,
): LatestPerfect[] {
  const ra = new Map<number, LatestPerfect>()
  for (const a of awards) {
    if (a.AwardType !== 'Mastery/Completion') continue
    const prev = ra.get(a.AwardData)
    if (prev && prev.date >= a.AwardedAt) continue
    ra.set(a.AwardData, {
      key: gameKey('ra', a.AwardData),
      source: 'ra',
      id: a.AwardData,
      title: a.Title,
      subtitle: a.ConsoleName,
      iconUrl: a.ImageIcon ? `https://retroachievements.org${a.ImageIcon}` : undefined,
      date: a.AwardedAt,
      hardcore: a.AwardDataExtra === 1,
    })
  }

  const steam: LatestPerfect[] = steamGames
    .filter((g) => classifySteamGame(g) === 'completed' && g.lastPlayed)
    .map((g) => ({
      key: gameKey('steam', g.id),
      source: 'steam',
      id: g.id,
      title: g.title,
      subtitle: g.consoleName,
      date: g.lastPlayed!,
      hardcore: false,
    }))

  return [...ra.values(), ...steam]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, count)
}
