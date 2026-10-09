import { classifySteamGame } from '@/utils/steamFeed'
import { classifyPsnGame } from '@/utils/psnTitles'
import type { PsnGameProgress } from '@/types/psn'
import { gameKey } from '@/utils/gameRef'
import type { RetroAchievementsGameCompleted, UserAward } from '@/types/types'
import type { GameSource, SteamGameProgress } from '@/types/steam'

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

  return [...byId.values(), ...steam, ...psn]
}

export type PerfectCounts = { hc: number; sc: number; steam: number; psn: number }

/** Counts for the card's header: RA hardcore, RA softcore, Steam, PSN. */
export function countPerfectGames(games: PerfectGame[]): PerfectCounts {
  return {
    hc: games.filter((g) => g.source === 'ra' && g.hardcore).length,
    sc: games.filter((g) => g.source === 'ra' && !g.hardcore).length,
    steam: games.filter((g) => g.source === 'steam').length,
    psn: games.filter((g) => g.source === 'psn').length,
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
  /** ISO-ish date string; for Steam the last session, the closest it reports; for PSN the last trophy. */
  date: string
  hardcore: boolean
}

/**
 * The most recent games taken to 100%, every platform, newest first. RA dates
 * come from its mastery and completion awards; Steam has no completion date,
 * so a perfect game's last session stands in for it (for a finished game, the
 * session that finished it); PSN's last trophy is, at 100%, the one that
 * finished it. One entry per RA game: a mastery after an earlier completion
 * is the same game, at its latest date.
 */
export function latestPerfects(
  awards: UserAward[] = [],
  steamGames: SteamGameProgress[] = [],
  count = 3,
  psnGames: PsnGameProgress[] = [],
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

  const psn: LatestPerfect[] = psnGames
    .filter((g) => classifyPsnGame(g) === 'completed' && g.lastTrophyAt)
    .map((g) => ({
      key: gameKey('psn', g.id),
      source: 'psn',
      id: g.id,
      title: g.title,
      subtitle: g.consoleName,
      iconUrl: g.coverUrl ?? (g.imageIcon || undefined),
      date: g.lastTrophyAt!,
      hardcore: false,
    }))

  return [...ra.values(), ...steam, ...psn]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, count)
}

/**
 * When each perfect game got to 100%, by key: RA from its latest mastery or
 * completion award, Steam from its last session (Steam keeps no completion
 * date; for a finished game that session is the one that finished it), PSN
 * from its last trophy.
 */
export function perfectDates(
  awards: UserAward[] = [],
  steamGames: SteamGameProgress[] = [],
  psnGames: PsnGameProgress[] = [],
): Map<string, string> {
  const byKey = new Map<string, string>()
  for (const a of awards) {
    if (a.AwardType !== 'Mastery/Completion') continue
    const key = gameKey('ra', a.AwardData)
    if ((byKey.get(key) ?? '') < a.AwardedAt) byKey.set(key, a.AwardedAt)
  }
  for (const g of steamGames) if (g.lastPlayed) byKey.set(gameKey('steam', g.id), g.lastPlayed)
  for (const g of psnGames) if (g.lastTrophyAt) byKey.set(gameKey('psn', g.id), g.lastTrophyAt)
  return byKey
}

export type PerfectFilter = 'all' | 'raHc' | 'raSc' | 'steam' | 'psn'

/** The perfect games of one kind: RA hardcore, RA softcore, Steam, PSN, or all of them. */
export function filterPerfects(games: PerfectGame[], filter: PerfectFilter): PerfectGame[] {
  if (filter === 'raHc') return games.filter((g) => g.source === 'ra' && g.hardcore)
  if (filter === 'raSc') return games.filter((g) => g.source === 'ra' && !g.hardcore)
  if (filter === 'steam') return games.filter((g) => g.source === 'steam')
  if (filter === 'psn') return games.filter((g) => g.source === 'psn')
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
  for (const g of games) {
    const date = dates.get(g.key)
    const year = date ? new Date(date.replace(' ', 'T')).getFullYear() : null
    const key = year !== null && !isNaN(year) ? year : null
    if (!byYear.has(key)) byYear.set(key, [])
    byYear.get(key)!.push(g)
  }
  const time = (g: PerfectGame) => Date.parse((dates.get(g.key) ?? '').replace(' ', 'T')) || 0
  return [...byYear]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : b - a))
    .map(([year, list]) => ({ year, games: year === null ? list : [...list].sort((x, y) => time(y) - time(x)) }))
}
