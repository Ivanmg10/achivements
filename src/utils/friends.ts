import type { RecentAchievement } from '@/types/types'
import type { GameSource } from '@/types/steam'
import type { UserSearchResult } from '@/hooks/useUserSearch'
import type { LibraryGame } from '@/utils/library'

type SavedGame = { id: number; title: string; imageIcon: string } | null

export type FriendPin = { source: GameSource; gameId: number; gameTitle: string; title: string | null; badge: string | null }

/** Someone you follow, as /api/follows/overview gives them. */
export type FriendOverview = UserSearchResult & {
  favorites: Record<GameSource, SavedGame>
  publicGroups: number
  pins: FriendPin[]
}

/**
 * How far back the activity numbers can look: RA's recent unlocks cover two
 * weeks, the shortest of the three platforms, so every count uses that window.
 */
export const ACTIVITY_DAYS = 14

export type FriendStats = {
  /** Unlocks in the last 7 days, every platform. */
  week: number
  /** Days with at least one unlock in the last ACTIVITY_DAYS. */
  activeDays: number
  /** Days in a row with an unlock, up to today or yesterday; at most ACTIVITY_DAYS. */
  streak: number
  /** The streak reaches the window's edge, so it may be longer: shown as "14+". */
  streakCapped: boolean
  completed: number
  played: number
}

export type StatKey = 'week' | 'activeDays' | 'streak' | 'completed'

const DAY = 86400000
const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10)

export function friendStats(recent: RecentAchievement[], games: LibraryGame[], now: number = Date.now()): FriendStats {
  const days = new Set<string>()
  let week = 0
  for (const a of recent) {
    const t = Date.parse(a.Date.replace(' ', 'T'))
    if (Number.isNaN(t)) continue
    if (t >= now - 7 * DAY) week++
    if (t >= now - ACTIVITY_DAYS * DAY) days.add(a.Date.slice(0, 10))
  }
  // A streak still counts when today has nothing yet: it runs up to yesterday.
  let start = days.has(dayKey(now)) ? now : now - DAY
  let streak = 0
  while (streak < ACTIVITY_DAYS && days.has(dayKey(start))) {
    streak++
    start -= DAY
  }
  return {
    week,
    activeDays: days.size,
    streak,
    streakCapped: streak >= ACTIVITY_DAYS,
    completed: games.filter((g) => g.status === 'completed').length,
    played: games.length,
  }
}

export type LeaderRow = { username: string; avatar: string | null; isMe: boolean; stats: FriendStats }

/** Best first on the chosen measure; ties go to the longer streak, then by name. */
export function rankBy(rows: LeaderRow[], key: StatKey): LeaderRow[] {
  return [...rows].sort((a, b) => b.stats[key] - a.stats[key] || b.stats.streak - a.stats.streak || a.username.localeCompare(b.username))
}

export type FriendGames = { username: string; avatar: string | null; games: LibraryGame[] }
export type SharedGameRow = { game: LibraryGame; friends: { username: string; avatar: string | null; pct: number }[] }

const unfinished = (row: SharedGameRow) => row.game.pct < 100 || row.friends.some((f) => f.pct < 100)

/** Your games that people you follow also play, the most shared first. */
export function sharedWithFriends(mine: LibraryGame[], friends: FriendGames[], limit = 12): SharedGameRow[] {
  const byKey = new Map(friends.map((f) => [f.username, new Map(f.games.map((g) => [g.key, g.pct]))]))
  return mine
    .map((game) => ({
      game,
      friends: friends
        .filter((f) => byKey.get(f.username)!.has(game.key))
        .map((f) => ({ username: f.username, avatar: f.avatar, pct: byKey.get(f.username)!.get(game.key)! })),
    }))
    .filter((row) => row.friends.length > 0)
    // Most shared first; then the ones somebody has still to finish, where there is a race to follow.
    .sort(
      (a, b) =>
        b.friends.length - a.friends.length ||
        Number(unfinished(b)) - Number(unfinished(a)) ||
        b.game.pct - a.game.pct ||
        a.game.title.localeCompare(b.game.title),
    )
    .slice(0, limit)
}

export type FeedItem = { username: string; avatar: string | null; achievement: RecentAchievement }

/** The latest unlocks of the people you follow, all together, newest first. */
export function friendsFeed(friends: { username: string; avatar: string | null; recent: RecentAchievement[] }[], limit = 20): FeedItem[] {
  return friends
    .flatMap((f) => f.recent.map((achievement) => ({ username: f.username, avatar: f.avatar, achievement })))
    .sort((a, b) => b.achievement.Date.localeCompare(a.achievement.Date))
    .slice(0, limit)
}
