import { gameKey } from '@/utils/gameRef'
import { classifySteamGame } from '@/utils/steamFeed'
import type { RecentlyPlayedGame, RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'
import type { GameSource, SteamGameProgress } from '@/types/steam'

/**
 * A game the user can pick — to pin, to add to a group, or to jump to from
 * search — from either platform, in one shape.
 *
 * Built from the data the app already holds (RA completion list, recent
 * games, want-to-play list; the Steam library), so picking needs no search API.
 */
export type CandidateStatus = 'completed-hc' | 'completed-sc' | 'perfect' | 'in-progress' | 'want-to-play'

export type GameCandidate = {
  key: string
  source: GameSource
  id: number
  title: string
  /** Console name for RA, "Steam" for Steam. */
  subtitle: string
  /** What to store as the game's image: RA's path, or Steam's icon URL. */
  imageRef: string
  /** Completion as a 0–1 fraction, as group items store it. */
  pctWon: number
  numAwarded: number
  maxPossible: number
  status: CandidateStatus | null
}

const STATUS_PRIORITY: Record<CandidateStatus, number> = {
  'completed-hc': 5,
  'perfect': 4,
  'completed-sc': 3,
  'in-progress': 2,
  'want-to-play': 1,
}

function better(a: CandidateStatus | null, b: CandidateStatus | null): boolean {
  return (a ? STATUS_PRIORITY[a] : 0) > (b ? STATUS_PRIORITY[b] : 0)
}

/**
 * RA candidates, one per game. A game can appear several times (softcore and
 * hardcore rows, recent list, want-to-play); the most advanced status wins.
 */
export function buildRaCandidates(
  completed: RetroAchievementsGameCompleted[],
  recent: RecentlyPlayedGame[],
  wantToPlay: WantToPlayGame[],
): GameCandidate[] {
  const map = new Map<number, GameCandidate>()
  const offer = (c: GameCandidate) => {
    const existing = map.get(c.id)
    if (!existing || better(c.status, existing.status)) map.set(c.id, c)
  }

  for (const g of completed) {
    const pct = parseFloat(g.PctWon) || 0
    let status: CandidateStatus
    if (pct >= 1) status = g.HardcoreMode === '1' ? 'completed-hc' : 'completed-sc'
    else status = 'in-progress'
    offer({
      key: gameKey('ra', g.GameID), source: 'ra', id: g.GameID, title: g.Title, subtitle: g.ConsoleName,
      imageRef: g.ImageIcon, pctWon: pct, numAwarded: g.NumAwarded, maxPossible: g.MaxPossible, status,
    })
  }

  for (const g of recent) {
    const total = g.NumPossibleAchievements
    const earned = Math.max(g.NumAchieved, g.NumAchievedHardcore)
    offer({
      key: gameKey('ra', g.GameID), source: 'ra', id: g.GameID, title: g.Title, subtitle: g.ConsoleName,
      imageRef: g.ImageIcon, pctWon: total > 0 ? earned / total : 0, numAwarded: earned, maxPossible: total,
      status: earned > 0 ? 'in-progress' : null,
    })
  }

  for (const g of wantToPlay) {
    const id = g.ID ?? g.GameID!
    offer({
      key: gameKey('ra', id), source: 'ra', id, title: g.Title, subtitle: g.ConsoleName,
      imageRef: g.ImageIcon, pctWon: 0, numAwarded: 0, maxPossible: g.AchievementsPublished, status: 'want-to-play',
    })
  }

  return Array.from(map.values())
}

const STEAM_STATUS: Record<string, CandidateStatus> = {
  completed: 'perfect',
  playing: 'in-progress',
  wantToPlay: 'want-to-play',
}

export function buildSteamCandidates(library: SteamGameProgress[]): GameCandidate[] {
  return library.map((g) => {
    const category = classifySteamGame(g)
    return {
      key: gameKey('steam', g.id), source: 'steam', id: g.id, title: g.title, subtitle: 'Steam',
      imageRef: g.imageIcon, pctWon: g.pctWon / 100, numAwarded: g.numAwarded, maxPossible: g.maxPossible,
      status: category ? STEAM_STATUS[category] : null,
    }
  })
}

/** Where to load a candidate's small icon from. */
export function candidateIconUrl(c: Pick<GameCandidate, 'source' | 'imageRef'>): string {
  if (!c.imageRef) return ''
  return c.source === 'ra' ? `https://retroachievements.org${c.imageRef}` : c.imageRef
}

/** Case- and accent-insensitive, so "pokemon" finds "Pokémon". */
export function normalizeTitle(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Title matches, best first: exact, then prefix, then a word starting with
 * the query, then anywhere. Already-chosen games (by key) are left out.
 */
export function searchCandidates(
  candidates: GameCandidate[],
  query: string,
  exclude: Set<string> = new Set(),
  limit = 20,
): GameCandidate[] {
  const q = normalizeTitle(query.trim())
  if (!q) return []
  return candidates
    .filter((c) => !exclude.has(c.key))
    .map((c) => {
      const t = normalizeTitle(c.title)
      if (!t.includes(q)) return null
      const score = t === q ? 3 : t.startsWith(q) ? 2 : t.split(/\s+/).some((w) => w.startsWith(q)) ? 1 : 0
      return { c, score }
    })
    .filter((x): x is { c: GameCandidate; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ c }) => c)
}

/** The body that adds a candidate to a group (POST /api/groups/[id]/games). */
export function candidateToGroupItemBody(c: GameCandidate) {
  return {
    source: c.source,
    game_id: c.id,
    title: c.title,
    image_icon: c.imageRef,
    console_name: c.subtitle,
    pct_won: c.pctWon,
    num_awarded: c.numAwarded,
    max_possible: c.maxPossible,
  }
}

/** Whether a game title matches a free-text filter. An empty filter matches everything. */
export function titleMatches(title: string, query: string): boolean {
  const q = normalizeTitle(query.trim())
  return q === '' || normalizeTitle(title).includes(q)
}
