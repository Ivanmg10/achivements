import { classifySteamGame, raDateToIso } from '@/utils/steamFeed'
import { classifyPsnGame } from '@/utils/psnTitles'
import type { PsnGameProgress } from '@/types/psn'
import { classifyXboxGame } from '@/utils/xboxTitles'
import type { XboxGameProgress } from '@/types/xbox'
import { gameKey } from '@/utils/gameRef'
import type { RetroAchievementsGameCompleted, UserAward } from '@/types/types'
import type { GameSource, SteamGameProgress } from '@/types/steam'
import { validCompletionDate } from '@/utils/completionDates'

/**
 * A game with every achievement, from either platform, in one shape — what
 * the "Mastered & Completed" card lists and what its custom order sorts.
 */
export type PerfectGame = {
  /** "ra:123" / "steam:620" / "psn:2018800" — the id the saved order stores. */
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
 * Every perfect game across all platforms. An RA game can appear twice
 * (softcore and hardcore rows); hardcore wins, as the card's counts do.
 */
export function buildPerfectGames(
  raGames: RetroAchievementsGameCompleted[],
  steamGames: SteamGameProgress[] = [],
  psnGames: PsnGameProgress[] = [],
  xboxGames: XboxGameProgress[] = [],
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

  const psn: PerfectGame[] = psnGames
    .filter((g) => classifyPsnGame(g) === 'completed')
    .map((g) => ({
      key: gameKey('psn', g.id),
      source: 'psn',
      id: g.id,
      title: g.title,
      imageUrl: g.imageIcon || undefined,
      subtitle: g.consoleName,
      hardcore: false,
    }))

  const xbox: PerfectGame[] = xboxGames
    .filter((g) => classifyXboxGame(g) === 'completed')
    .map((g) => ({
      key: gameKey('xbox', g.id),
      source: 'xbox',
      id: g.id,
      title: g.title,
      imageUrl: g.imageIcon || undefined,
      subtitle: g.consoleName,
      hardcore: false,
    }))

  return [...byId.values(), ...steam, ...psn, ...xbox]
}

export type PerfectCounts = { hc: number; sc: number; steam: number; psn: number; xbox: number }

/** Counts for the card's header: RA hardcore, RA softcore, Steam, PSN, Xbox. */
export function countPerfectGames(games: PerfectGame[]): PerfectCounts {
  return {
    hc: games.filter((g) => g.source === 'ra' && g.hardcore).length,
    sc: games.filter((g) => g.source === 'ra' && !g.hardcore).length,
    steam: games.filter((g) => g.source === 'steam').length,
    psn: games.filter((g) => g.source === 'psn').length,
    xbox: games.filter((g) => g.source === 'xbox').length,
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
  /** Platform-proven base completion date; activity-only timestamps are never used. */
  date: string
  hardcore: boolean
}

/**
 * The most recent games with a reliable completion date, newest first. RA uses
 * mastery/completion awards and PSN its default-group timestamp. Steam and Xbox
 * use the latest achievement only when their whole current set is complete.
 */
export function latestPerfects(
  awards: UserAward[] = [],
  steamGames: SteamGameProgress[] = [],
  count = 3,
  psnGames: PsnGameProgress[] = [],
  xboxGames: XboxGameProgress[] = [],
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
    .filter((g) => classifySteamGame(g) === 'completed' && validCompletionDate(g.lastUnlock))
    .map((g) => ({
      key: gameKey('steam', g.id),
      source: 'steam',
      id: g.id,
      title: g.title,
      subtitle: g.consoleName,
      date: validCompletionDate(g.lastUnlock)!,
      hardcore: false,
    }))

  const psn: LatestPerfect[] = psnGames
    .filter((g) => classifyPsnGame(g) === 'completed' && g.completedAt)
    .map((g) => ({
      key: gameKey('psn', g.id),
      source: 'psn',
      id: g.id,
      title: g.title,
      subtitle: g.consoleName,
      iconUrl: g.coverUrl ?? (g.imageIcon || undefined),
      date: g.completedAt!,
      hardcore: false,
    }))

  const xbox: LatestPerfect[] = xboxGames
    .filter((g) => classifyXboxGame(g) === 'completed' && g.completedAt)
    .map((g) => ({
      key: gameKey('xbox', g.id),
      source: 'xbox',
      id: g.id,
      title: g.title,
      subtitle: g.consoleName,
      iconUrl: g.imageIcon || undefined,
      date: g.completedAt!,
      hardcore: false,
    }))

  return [...ra.values(), ...steam, ...psn, ...xbox]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, count)
}

/**
 * Reliable completion dates by key. Steam uses its latest unlock and Xbox its
 * enriched latest achievement, only for games whose current set is complete.
 */
export function perfectDates(
  awards: UserAward[] = [],
  steamGames: SteamGameProgress[] = [],
  psnGames: PsnGameProgress[] = [],
  xboxGames: XboxGameProgress[] = [],
): Map<string, string> {
  const byKey = new Map<string, string>()
  for (const a of awards) {
    if (a.AwardType !== 'Mastery/Completion') continue
    const key = gameKey('ra', a.AwardData)
    if ((byKey.get(key) ?? '') < a.AwardedAt) byKey.set(key, a.AwardedAt)
  }
  for (const g of steamGames) if (classifySteamGame(g) === 'completed' && validCompletionDate(g.lastUnlock)) byKey.set(gameKey('steam', g.id), validCompletionDate(g.lastUnlock)!)
  for (const g of psnGames) if (g.completedAt) byKey.set(gameKey('psn', g.id), g.completedAt)
  for (const g of xboxGames) if (classifyXboxGame(g) === 'completed' && g.completedAt) byKey.set(gameKey('xbox', g.id), g.completedAt)
  return byKey
}

export type PerfectFilter = 'all' | 'raHc' | 'raSc' | 'steam' | 'psn' | 'xbox'

/** The perfect games of one kind: RA hardcore, RA softcore, Steam, PSN, or all of them. */
export function filterPerfects(games: PerfectGame[], filter: PerfectFilter): PerfectGame[] {
  if (filter === 'raHc') return games.filter((g) => g.source === 'ra' && g.hardcore)
  if (filter === 'raSc') return games.filter((g) => g.source === 'ra' && !g.hardcore)
  if (filter === 'steam') return games.filter((g) => g.source === 'steam')
  if (filter === 'psn') return games.filter((g) => g.source === 'psn')
  if (filter === 'xbox') return games.filter((g) => g.source === 'xbox')
  return games
}

/**
 * Perfect games grouped by the year they got to 100%, newest year first and
 * newest game first inside it. Games with no known date go last, in a group
 * of their own (year null), in the order given.
 */
export function groupPerfectsByYear(
  games: PerfectGame[],
  dates: Map<string, string>,
): { year: number | null; games: PerfectGame[] }[] {
  const byYear = new Map<number | null, PerfectGame[]>()
  // RA dates are "YYYY-MM-DD HH:MM:SS" in UTC; the others are ISO with a zone.
  const time = (g: PerfectGame) => {
    const date = dates.get(g.key)
    return date ? Date.parse(raDateToIso(date) ?? date) : NaN
  }
  for (const g of games) {
    const t = time(g)
    const key = isNaN(t) ? null : new Date(t).getFullYear()
    if (!byYear.has(key)) byYear.set(key, [])
    byYear.get(key)!.push(g)
  }
  return [...byYear]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : b - a))
    .map(([year, list]) => ({ year, games: year === null ? list : [...list].sort((x, y) => time(y) - time(x)) }))
}
