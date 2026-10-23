import pool from '@/lib/db'
import { queryRows } from '@/lib/queryRows'
import { presenceColumns } from '@/lib/presence'
import { isUploadedAvatar } from '@/lib/avatarImage'
import type { GameSource } from '@/types/steam'
import { lastWeeks, monthStart, weekStart } from '@/utils/vaultLevel'

/**
 * The rankings, read from the stored scores (scoreRefresh keeps them). Only
 * users with a public profile who did not opt out are listed; the viewer
 * always sees their own standing. A game counts only for the account still
 * linked, and never while it is flagged. Xbox only for admins.
 */

export type RankScope = 'global' | 'following'
export type RankPeriod = 'all' | 'month' | 'week'
export type RankSource = 'all' | GameSource

export const RANK_SCOPES: RankScope[] = ['global', 'following']
export const RANK_PERIODS: RankPeriod[] = ['all', 'month', 'week']
export const RANK_SOURCES: RankSource[] = ['all', 'ra', 'steam', 'psn', 'xbox']
/** What the list is ordered by: points, the current streak, or the longest one. */
export type RankSort = 'points' | 'streak' | 'best'
export const RANK_SORTS: RankSort[] = ['points', 'streak', 'best']

export type RankEntry = {
  id: number
  username: string
  avatar: string | null
  /** In the chosen period and platforms: what the order is by. */
  points: number
  /** All time, every platform the viewer may see: what the level is read from. */
  totalPoints: number
  /** The chosen period's points, per platform. */
  split: Partial<Record<GameSource, number>>
  /** All time, on the chosen platforms. */
  completed: number
  achievements: number
  rank: number
  /** False only for the viewer's own row, when others do not see them listed. */
  listed: boolean
}

type GameRow = { id: number; username: string; avatar: string | null; listed: boolean; source: GameSource; points: number; completed: number; achievements: number }
type PeriodRow = { id: number; source: GameSource; points: number }

// A game belongs to the account linked now; relinking another drops the old one's games at once.
const LINKED_ACCOUNT = `g.account = CASE g.source WHEN 'ra' THEN u.rausername WHEN 'steam' THEN u.steamid
                         WHEN 'psn' THEN u.psnaccountid WHEN 'xbox' THEN u.xboxxuid END`

/** Who: everyone listed (global), or the viewer and whom they follow, or the viewer alone. */
function audience(scope: RankScope | 'self'): string {
  if (scope === 'self') return 'u.id = $2'
  const listed = '((u.profile_public AND u.show_in_rankings) OR u.id = $2)'
  return scope === 'global' ? listed : `${listed} AND (u.id = $2 OR u.id IN (SELECT followed_id FROM follows WHERE follower_id = $2))`
}

async function gameRows(scope: RankScope | 'self', viewerId: number, xbox: boolean): Promise<GameRow[]> {
  return queryRows<GameRow>(
    `SELECT u.id, u.username, u.avatar, (u.profile_public AND u.show_in_rankings) AS listed, g.source,
            SUM(g.points * g.stack_factor)::float AS points,
            COUNT(*) FILTER (WHERE g.completed)::int AS completed, SUM(g.earned)::int AS achievements
     FROM score_games g JOIN users u ON u.id = g.user_id
     WHERE g.flag IS DISTINCT FROM 'suspect' AND ${LINKED_ACCOUNT}
       AND ($1::boolean OR g.source <> 'xbox') AND ${audience(scope)}
     GROUP BY u.id, g.source`,
    [xbox, viewerId],
  )
}

async function periodRows(period: Exclude<RankPeriod, 'all'>, xbox: boolean, now: Date, userId?: number): Promise<PeriodRow[]> {
  const kind = period === 'week' ? 'w' : 'm'
  const start = period === 'week' ? weekStart(now) : monthStart(now)
  return queryRows<PeriodRow>(
    `SELECT user_id AS id, source, SUM(points)::int AS points FROM score_periods
     WHERE kind = $1 AND start = $2::date AND ($3::boolean OR source <> 'xbox') AND ($4::int IS NULL OR user_id = $4)
     GROUP BY user_id, source`,
    [kind, start, xbox, userId ?? null],
  )
}

/**
 * Users ordered by points (then games finished, then name), with competition
 * ranks (equal points share a place). Who has nothing in the chosen period and
 * platforms is left out, as is anyone not listed (their own row is ranked apart).
 */
export function rankEntries(rows: GameRow[], periods: PeriodRow[] | null, source: RankSource): RankEntry[] {
  const users = new Map<number, RankEntry>()
  const wanted = (s: GameSource) => source === 'all' || s === source
  for (const r of rows) {
    const u = users.get(r.id) ?? { id: r.id, username: r.username, avatar: r.avatar, points: 0, totalPoints: 0, split: {}, completed: 0, achievements: 0, rank: 0, listed: r.listed }
    u.totalPoints += r.points
    if (wanted(r.source)) {
      u.completed += r.completed
      u.achievements += r.achievements
      if (!periods) u.split[r.source] = Math.round(r.points)
    }
    users.set(r.id, u)
  }
  if (periods) {
    for (const p of periods) {
      const u = users.get(p.id)
      if (u && wanted(p.source)) u.split[p.source] = (u.split[p.source] ?? 0) + p.points
    }
  }
  const list = [...users.values()].map((u) => ({
    ...u,
    totalPoints: Math.round(u.totalPoints),
    points: Object.values(u.split).reduce((s, x) => s + (x ?? 0), 0),
  }))
  const ranked = list
    .filter((u) => u.listed && u.points > 0)
    .sort((a, b) => b.points - a.points || b.completed - a.completed || a.username.localeCompare(b.username))
  ranked.forEach((u, i) => {
    u.rank = i > 0 && ranked[i - 1].points === u.points ? ranked[i - 1].rank : i + 1
  })
  // An unlisted viewer still learns where they would stand.
  for (const u of list) if (!u.listed) u.rank = u.points > 0 ? 1 + ranked.filter((r) => r.points > u.points).length : 0
  return [...ranked, ...list.filter((u) => !u.listed)]
}

/** What the global lists are built from, the same for everyone: kept briefly per instance. */
const GLOBAL_TTL_MS = 5 * 60 * 1000
const globalCache = new Map<string, { at: number; rows: unknown }>()

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = globalCache.get(key)
  if (hit && Date.now() - hit.at < GLOBAL_TTL_MS) return hit.rows as T
  const rows = await load()
  globalCache.set(key, { at: Date.now(), rows })
  return rows
}

export async function loadRanking(opts: { scope: RankScope; period: RankPeriod; source: RankSource; viewerId: number | null; xbox: boolean; now?: Date }): Promise<RankEntry[]> {
  const { scope, period, source, xbox } = opts
  const now = opts.now ?? new Date()
  const viewer = opts.viewerId ?? -1

  if (scope === 'following') {
    const [rows, periods] = await Promise.all([gameRows('following', viewer, xbox), period === 'all' ? null : periodRows(period, xbox, now)])
    return rankEntries(rows, periods, source)
  }

  const start = period === 'week' ? weekStart(now) : monthStart(now)
  const [rows, periods] = await Promise.all([
    cached(`g|${xbox}`, () => gameRows('global', -1, xbox)),
    period === 'all' ? null : cached(`p|${period}|${start}|${xbox}`, () => periodRows(period, xbox, now)),
  ])
  if (viewer < 0) return rankEntries(rows, periods, source)
  // Everyone else may be a few minutes old; the viewer's own row is always read now, so their
  // points move as soon as a refresh lands (and an unlisted viewer still learns where they stand).
  const [own, ownPeriods] = await Promise.all([gameRows('self', viewer, xbox), period === 'all' ? null : periodRows(period, xbox, now, viewer)])
  return rankEntries(
    [...rows.filter((r) => r.id !== viewer), ...own],
    periods && [...periods.filter((p) => p.id !== viewer), ...(ownPeriods ?? [])],
    source,
  )
}

/** How many weeks a row's trend goes back. */
export const TREND_WEEKS = 8

/** Points each user earned in each of the last TREND_WEEKS weeks, oldest first, zeros included, on the chosen platforms. */
export async function weeklyTrend(userIds: number[], source: RankSource, xbox: boolean, now = new Date()): Promise<Map<number, number[]>> {
  const weeks = lastWeeks(now, TREND_WEEKS)
  const trend = new Map(userIds.map((id) => [id, weeks.map(() => 0)]))
  if (userIds.length === 0) return trend
  const rows = await queryRows<{ id: number; start: string; points: number }>(
    `SELECT user_id AS id, to_char(start, 'YYYY-MM-DD') AS start, SUM(points)::int AS points FROM score_periods
     WHERE kind = 'w' AND start >= $1::date AND user_id = ANY($2::int[])
       AND ($3::text = 'all' OR source = $3) AND ($4::boolean OR source <> 'xbox')
     GROUP BY user_id, start`,
    [weeks[0], userIds, source, xbox],
  )
  for (const r of rows) {
    const i = weeks.indexOf(r.start)
    const list = trend.get(r.id)
    if (list && i >= 0) list[i] = r.points
  }
  return trend
}

export type Streak = { current: number; best: number }

const DAY_S = 86400

/** Days in a row with an unlock, from sorted unique day numbers: the run up to today or yesterday, and the longest. */
export function streakOf(days: number[], today: number): Streak {
  let run = 0
  let best = 0
  days.forEach((d, i) => {
    run = i > 0 && d === days[i - 1] + 1 ? run + 1 : 1
    best = Math.max(best, run)
  })
  const last = days[days.length - 1]
  return { current: last !== undefined && last >= today - 1 ? run : 0, best }
}

/**
 * Each user's streaks on the chosen platforms, from the days stored with their scored games
 * (UTC days, as weeks and months are), so no platform is asked. Games without dates
 * (provisional) do not count; hidden games and unticked consoles are not stored at all.
 */
export async function streaksOf(userIds: number[], source: RankSource, xbox: boolean, now = new Date()): Promise<Map<number, Streak>> {
  if (userIds.length === 0) return new Map()
  // ponytail: reads every stored day of every user asked on each call; keep a per-user column if the list grows large.
  const rows = await queryRows<{ id: number; days: number[] }>(
    `SELECT g.user_id AS id, array_agg(DISTINCT ((x->>0)::bigint / ${DAY_S})::int ORDER BY ((x->>0)::bigint / ${DAY_S})::int) AS days
     FROM score_games g JOIN users u ON u.id = g.user_id, jsonb_array_elements(g.unlocks) x
     WHERE g.user_id = ANY($1::int[]) AND (x->>0)::bigint > 0 AND g.flag IS DISTINCT FROM 'suspect' AND ${LINKED_ACCOUNT}
       AND ($2::text = 'all' OR g.source = $2) AND ($3::boolean OR g.source <> 'xbox')
     GROUP BY g.user_id`,
    [userIds, source, xbox],
  )
  const today = Math.floor(now.getTime() / 1000 / DAY_S)
  return new Map(rows.map((r) => [r.id, streakOf(r.days, today)]))
}

/** The same users ordered by a streak (longer first, then points, then name), sharing a place on equal streaks; who has none is left out. */
export function rankByStreak(entries: RankEntry[], streaks: Map<number, Streak>, key: keyof Streak): RankEntry[] {
  const value = (e: RankEntry) => streaks.get(e.id)?.[key] ?? 0
  const ranked = entries
    .filter((e) => e.listed && value(e) > 0)
    .sort((a, b) => value(b) - value(a) || b.points - a.points || a.username.localeCompare(b.username))
    .map((e) => ({ ...e }))
  ranked.forEach((u, i) => {
    u.rank = i > 0 && value(ranked[i - 1]) === value(u) ? ranked[i - 1].rank : i + 1
  })
  const unlisted = entries.filter((e) => !e.listed).map((u) => ({ ...u, rank: value(u) > 0 ? 1 + ranked.filter((r) => value(r) > value(u)).length : 0 }))
  return [...ranked, ...unlisted]
}

/** Where each listed user stood at the start of this week (global, all time, no Xbox). */
export async function weekStartRanks(now = new Date()): Promise<Map<number, number>> {
  const rows = await queryRows<{ user_id: number; rank: number }>('SELECT user_id, rank FROM score_snapshots WHERE week = $1::date', [weekStart(now)])
  return new Map(rows.map((r) => [r.user_id, r.rank]))
}

/** Once a week (the daily cron calls it every day): the global standings, for the arrows. Kept twelve weeks. */
export async function takeWeeklySnapshot(now = new Date()): Promise<boolean> {
  const week = weekStart(now)
  const { rowCount } = await pool.query('SELECT 1 FROM score_snapshots WHERE week = $1::date LIMIT 1', [week])
  if (rowCount) return false
  const entries = rankEntries(await gameRows('global', -1, false), null, 'all').filter((e) => e.listed)
  if (entries.length > 0) {
    await pool.query(
      `INSERT INTO score_snapshots (user_id, week, rank, points)
       SELECT s.id, $1::date, s.rank, s.points FROM jsonb_to_recordset($2::jsonb) AS s(id int, rank int, points int)
       ON CONFLICT DO NOTHING`,
      [week, JSON.stringify(entries.map((e) => ({ id: e.id, rank: e.rank, points: e.points })))],
    )
  }
  await pool.query(`DELETE FROM score_snapshots WHERE week < $1::date - interval '12 weeks'`, [week])
  return true
}

/** Total points per user (all time, every platform the viewer may see), for badges outside the rankings. */
export async function vaultTotals(userIds: number[], xbox: boolean): Promise<Map<number, number>> {
  if (userIds.length === 0) return new Map()
  const rows = await queryRows<{ id: number; points: number }>(
    `SELECT g.user_id AS id, SUM(g.points * g.stack_factor)::float AS points
     FROM score_games g JOIN users u ON u.id = g.user_id
     WHERE g.user_id = ANY($1::int[]) AND g.flag IS DISTINCT FROM 'suspect' AND ${LINKED_ACCOUNT}
       AND ($2::boolean OR g.source <> 'xbox')
     GROUP BY g.user_id`,
    [userIds, xbox],
  )
  return new Map(rows.map((r) => [r.id, Math.round(r.points)]))
}

/** vaultTotals for pages where the points are an extra: a failure leaves them out instead of failing the page. */
export async function vaultTotalsOrNone(userIds: number[], xbox: boolean): Promise<Map<number, number>> {
  try {
    return await vaultTotals(userIds, xbox)
  } catch (err) {
    console.error('[rankings] totals', err)
    return new Map()
  }
}

export type ProfileTeaser = {
  username: string
  avatar: string | null
  /** All time, without Xbox: what the level is read from. */
  points: number
  split: Partial<Record<GameSource, number>>
  completed: number
  achievements: number
}

/**
 * What anyone, signed out, may see of a user: what the public rankings already
 * show of them, so only someone listed there (public profile, not opted out).
 * Null for anyone else, so a private profile and a missing one look the same.
 */
export async function profileTeaser(username: string): Promise<ProfileTeaser | null> {
  const rows = await queryRows<{ username: string; avatar: string | null; source: GameSource | null; points: number | null; completed: number; achievements: number }>(
    `SELECT u.username, u.avatar, g.source, SUM(g.points * g.stack_factor)::float AS points,
            COUNT(g.*) FILTER (WHERE g.completed)::int AS completed, COALESCE(SUM(g.earned), 0)::int AS achievements
     FROM users u
     LEFT JOIN score_games g ON g.user_id = u.id AND g.flag IS DISTINCT FROM 'suspect' AND g.source <> 'xbox' AND ${LINKED_ACCOUNT}
     WHERE LOWER(u.username) = LOWER($1) AND u.profile_public AND u.show_in_rankings
     GROUP BY u.username, u.avatar, g.source`,
    [username],
  )
  if (rows.length === 0) return null
  // An uploaded picture is served only to signed-in users; the teaser is for those who are not.
  const avatar = isUploadedAvatar(rows[0].avatar) ? null : rows[0].avatar
  const teaser: ProfileTeaser = { username: rows[0].username, avatar, points: 0, split: {}, completed: 0, achievements: 0 }
  for (const r of rows) {
    if (!r.source) continue
    teaser.split[r.source] = Math.round(r.points ?? 0)
    teaser.points += r.points ?? 0
    teaser.completed += r.completed
    teaser.achievements += r.achievements
  }
  teaser.points = Math.round(teaser.points)
  return teaser
}

export type Presence = { online: boolean; lastSeenAt: string | null }

/** Online and last seen for the users shown, under the same rule as everywhere (presenceColumns). */
export async function presenceOf(userIds: number[]): Promise<Map<number, Presence>> {
  if (userIds.length === 0) return new Map()
  const rows = await queryRows<Presence & { id: number }>(`SELECT id, ${presenceColumns()} FROM users WHERE id = ANY($1::int[])`, [userIds])
  return new Map(rows.map((r) => [r.id, { online: r.online, lastSeenAt: r.lastSeenAt }]))
}
