import type { RecentAchievement } from '@/types/types'
import type { GameSource, SteamGameProgress } from '@/types/steam'
import type { PsnGameProgress } from '@/types/psn'
import type { XboxGameProgress } from '@/types/xbox'
import type { UserSearchResult } from '@/hooks/useUserSearch'
import type { LibraryGame } from '@/utils/library'
import { achievementBadgeUrl, achievementGameIconUrl } from '@/utils/utils'
import { steamAssetUrl } from '@/lib/steamClient'

type SavedGame = { id: number; title: string; imageIcon: string } | null

export type FriendPin = {
  source: GameSource
  gameId: number
  gameTitle: string
  title: string | null
  /** Null when the snapshot has none, or for a secret Xbox achievement not yet earned. */
  description?: string | null
  badge: string | null
}

/** Someone you follow, as /api/follows/overview gives them. */
export type FriendOverview = UserSearchResult & {
  /** The name each linked account goes by (RA user, Steam and PSN names, gamertag). */
  accounts?: Partial<Record<GameSource, string | null>>
  favorites: Partial<Record<GameSource, SavedGame>>
  publicGroups: number
  /** Their achievement showcase, in their order (up to five, earned). */
  showcase: FriendPin[]
  /** Their Vault Points, for the level on their card; null before they are scored. */
  vaultPoints?: number | null
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

export type LeaderRow = { username: string; avatar: string | null; online?: boolean; isMe: boolean; stats: FriendStats }

/** Best first on the chosen measure; ties go to the longer streak, then by name. */
export function rankBy(rows: LeaderRow[], key: StatKey): LeaderRow[] {
  return [...rows].sort((a, b) => b.stats[key] - a.stats[key] || b.stats.streak - a.stats.streak || a.username.localeCompare(b.username))
}

export type FriendGames = { username: string; avatar: string | null; online?: boolean; games: LibraryGame[] }
export type SharedGameRow = { game: LibraryGame; friends: { username: string; avatar: string | null; online?: boolean; pct: number }[] }

const unfinished = (row: SharedGameRow) => row.game.pct < 100 || row.friends.some((f) => f.pct < 100)

/** Your games that people you follow also play, the most shared first. */
export function sharedWithFriends(mine: LibraryGame[], friends: FriendGames[], limit = 12): SharedGameRow[] {
  const byKey = new Map(friends.map((f) => [f.username, new Map(f.games.map((g) => [g.key, g.pct]))]))
  return mine
    .map((game) => ({
      game,
      friends: friends
        .filter((f) => byKey.get(f.username)!.has(game.key))
        .map((f) => ({ username: f.username, avatar: f.avatar, online: f.online, pct: byKey.get(f.username)!.get(game.key)! })),
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

/** The people you follow whose name contains `query` (any case) and who play on every one of `platforms`. */
export function filterFollowing<U extends UserSearchResult>(users: U[], query: string, platforms: GameSource[]): U[] {
  const q = query.trim().toLowerCase()
  return users.filter((u) => platforms.every((p) => u[p]) && (!q || u.username.toLowerCase().includes(q)))
}

/** The game someone played last, with art for a backdrop: wide art (a store header) or an icon, to be blurred. */
export type LastPlayed = { source: GameSource; id: number; title: string; at: string; image: string | null; wide: boolean }

const playedAt = (s: string) => Date.parse(s.includes('T') ? s : s.replace(' ', 'T'))

/**
 * The most recently played game across platforms. Steam, PSN and Xbox say when
 * a game was last played; RA does not, so its latest unlock stands in for it.
 */
export function lastPlayedGame(
  raRecent: RecentAchievement[],
  steam: SteamGameProgress[],
  psn: PsnGameProgress[],
  xbox: XboxGameProgress[],
): LastPlayed | null {
  const candidates: LastPlayed[] = [
    ...raRecent
      .filter((a) => !a.Source)
      .map((a) => ({ source: 'ra' as const, id: a.GameID, title: a.GameTitle, at: a.Date, image: achievementGameIconUrl(a) ?? null, wide: false })),
    ...steam.flatMap((g) => (g.lastPlayed ? [{ source: 'steam' as const, id: g.id, title: g.title, at: g.lastPlayed, image: steamAssetUrl(g.id, 'header'), wide: true }] : [])),
    ...psn.flatMap((g) => (g.lastPlayed ? [{ source: 'psn' as const, id: g.id, title: g.title, at: g.lastPlayed, image: g.heroUrl ?? g.imageIcon ?? null, wide: !!g.heroUrl }] : [])),
    ...xbox.flatMap((g) => (g.lastPlayed ? [{ source: 'xbox' as const, id: g.id, title: g.title, at: g.lastPlayed, image: g.imageIcon || null, wide: false }] : [])),
  ].filter((c) => !Number.isNaN(playedAt(c.at)))
  return candidates.reduce<LastPlayed | null>((best, c) => (!best || playedAt(c.at) > playedAt(best.at) ? c : best), null)
}

/** A recent unlock in a pin's shape, so it can sit in the same row of badges. */
export function recentAsBadge(a: RecentAchievement): FriendPin {
  return { source: a.Source ?? 'ra', gameId: a.GameID, gameTitle: a.GameTitle, title: a.Title, description: a.Description || null, badge: achievementBadgeUrl(a) ?? null }
}

/** Past this, "seen" no longer says how long ago: just that it was a while. */
const SEEN_LONG_AGO_MS = 30 * 86400000

export type Presence = { kind: 'online' } | { kind: 'seen'; at: string } | { kind: 'longAgo' }

/** What to say about whether someone is around: online, seen a while ago, or nothing (never seen, or not shared). */
export function presenceOf(friend: { online?: boolean; lastSeenAt?: string | null }, now: number = Date.now()): Presence | null {
  if (friend.online) return { kind: 'online' }
  if (!friend.lastSeenAt) return null
  const at = Date.parse(friend.lastSeenAt)
  if (Number.isNaN(at)) return null
  return now - at > SEEN_LONG_AGO_MS ? { kind: 'longAgo' } : { kind: 'seen', at: friend.lastSeenAt }
}
