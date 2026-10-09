import { classifySteamGame } from '@/utils/steamFeed'
import { gameHref, gameKey } from '@/utils/gameRef'
import { classifyPsnGame } from '@/utils/psnTitles'
import { PSN_PLATFORM } from '@/utils/psnMappers'
import type { PsnGameProgress } from '@/types/psn'
import { normalizeTitle } from '@/utils/gameCandidates'
import type { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import type { GameSource, SteamGameProgress } from '@/types/steam'

export type LibraryStatus = 'playing' | 'wantToPlay' | 'completed'

/** One game of any platform, in the shape Browse lists, searches and picks from. */
export type LibraryGame = {
  key: string
  source: GameSource
  id: number
  title: string
  /** Console for RA, "Steam" / "PlayStation" for the others. */
  subtitle: string
  iconUrl?: string
  /** Box art where it differs from the icon (PSN's store art); the picker shows it. */
  coverUrl?: string
  status: LibraryStatus
  /** 0–100; 0 for a game not started. */
  pct: number
  href: string
}

const raIcon = (path?: string) => (path ? `https://retroachievements.org${path}` : undefined)

/**
 * Every library as one list, one entry per game. RA's started games can come
 * twice (softcore and hardcore rows): the higher progress wins. Steam games
 * with no achievement data yet are left out, since they have no status.
 */
export function buildLibrary(
  ra: { playing: RetroAchievementsGameCompleted[]; completed: RetroAchievementsGameCompleted[]; wantToPlay: WantToPlayGame[] },
  steam: SteamGameProgress[] = [],
  psn: PsnGameProgress[] = [],
): LibraryGame[] {
  const byKey = new Map<string, LibraryGame>()
  const put = (g: LibraryGame) => {
    const prev = byKey.get(g.key)
    if (!prev || g.pct > prev.pct) byKey.set(g.key, g)
  }

  for (const [list, status] of [[ra.playing, 'playing'], [ra.completed, 'completed']] as const) {
    for (const g of list) {
      put({
        key: gameKey('ra', g.GameID), source: 'ra', id: g.GameID, title: g.Title, subtitle: g.ConsoleName,
        iconUrl: raIcon(g.ImageIcon), status, pct: Math.round(parseFloat(g.PctWon) * 100), href: `/gameInfo/${g.GameID}`,
      })
    }
  }
  for (const g of ra.wantToPlay) {
    const id = g.ID ?? g.GameID!
    if (byKey.has(gameKey('ra', id))) continue
    put({
      key: gameKey('ra', id), source: 'ra', id, title: g.Title, subtitle: g.ConsoleName,
      iconUrl: raIcon(g.ImageIcon), status: 'wantToPlay', pct: 0, href: `/gameInfo/${id}`,
    })
  }
  for (const g of steam) {
    const status = classifySteamGame(g)
    if (!status) continue
    put({
      key: gameKey('steam', g.id), source: 'steam', id: g.id, title: g.title, subtitle: 'Steam',
      iconUrl: g.imageIcon || undefined, status, pct: Math.round(g.pctWon), href: `/steamGame/${g.id}`,
    })
  }
  for (const g of psn) {
    const status = classifyPsnGame(g)
    put({
      key: gameKey('psn', g.id), source: 'psn', id: g.id, title: g.title, subtitle: PSN_PLATFORM,
      iconUrl: g.imageIcon || undefined, coverUrl: g.coverUrl ?? undefined, status, pct: Math.round(g.pctWon), href: gameHref('psn', g.id),
    })
  }
  return [...byKey.values()]
}

export type LibraryFilter = { query: string; source: GameSource | 'all'; status: LibraryStatus | 'all' }

/** Accent- and case-insensitive title match, plus the platform and status chips. */
export function filterLibrary(games: LibraryGame[], { query, source, status }: LibraryFilter): LibraryGame[] {
  const q = normalizeTitle(query.trim())
  return games.filter(
    (g) =>
      (source === 'all' || g.source === source) &&
      (status === 'all' || g.status === status) &&
      (!q || normalizeTitle(g.title).includes(q)),
  )
}

export type ConsoleSummary = { consoleId: number; console: string; games: number; completed: number; pct: number }

/** RA games started per console: how many, how many at 100%, and that share. Most games first. */
export function summarizeConsoles(games: RetroAchievementsGameCompleted[]): ConsoleSummary[] {
  const byConsole = new Map<number, { console: string; best: Map<number, number> }>()
  for (const g of games) {
    if (!byConsole.has(g.ConsoleID)) byConsole.set(g.ConsoleID, { console: g.ConsoleName, best: new Map() })
    const best = byConsole.get(g.ConsoleID)!.best
    best.set(g.GameID, Math.max(best.get(g.GameID) ?? 0, parseFloat(g.PctWon)))
  }
  return [...byConsole]
    .map(([consoleId, { console, best }]) => {
      const completed = [...best.values()].filter((p) => p >= 1).length
      return { consoleId, console, games: best.size, completed, pct: Math.round((completed / best.size) * 100) }
    })
    .sort((a, b) => b.games - a.games || a.console.localeCompare(b.console))
}
