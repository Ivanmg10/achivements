import pool from '@/lib/db'
import { queryRows } from '@/lib/queryRows'
import { presenceColumns } from '@/lib/presence'
import type { GameSource } from '@/types/steam'
import { monthStart, weekStart } from '@/utils/vaultLevel'

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

async function periodRows(period: Exclude<RankPeriod, 'all'>, xbox: boolean, now: Date): Promise<PeriodRow[]> {
  const kind = period === 'week' ? 'w' : 'm'
  const start = period === 'week' ? weekStart(now) : monthStart(now)
  return queryRows<PeriodRow>(
    `SELECT user_id AS id, source, SUM(points)::int AS points FROM score_periods
     WHERE kind = $1 AND start = $2::date AND ($3::boolean OR source <> 'xbox')
     GROUP BY user_id, source`,
    [kind, start, xbox],
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

/** Global lists are the same for everyone with the same view: kept briefly per instance. */
const GLOBAL_TTL_MS = 5 * 60 * 1000
const globalCache = new Map<string, { at: number; entries: RankEntry[] }>()

export async function loadRanking(opts: { scope: RankScope; period: RankPeriod; source: RankSource; viewerId: number | null; xbox: boolean; now?: Date }): Promise<RankEntry[]> {
  const { scope, period, source, xbox } = opts
  const now = opts.now ?? new Date()
  const viewer = opts.viewerId ?? -1
  const periods = period === 'all' ? null : periodRows(period, xbox, now)

  if (scope === 'following') return rankEntries(await gameRows('following', viewer, xbox), periods && (await periods), source)

  const key = `${period}|${source}|${xbox}|${period === 'week' ? weekStart(now) : monthStart(now)}`
  const hit = globalCache.get(key)
  let entries: RankEntry[]
  if (hit && Date.now() - hit.at < GLOBAL_TTL_MS) entries = hit.entries
  else {
    entries = rankEntries(await gameRows('global', -1, xbox), periods && (await periods), source)
    globalCache.set(key, { at: Date.now(), entries })
  }
  if (viewer < 0 || entries.some((e) => e.id === viewer)) return entries
  // The viewer is not listed (private, opted out, or nothing scored yet): rank them apart.
  const own = rankEntries(await gameRows('self', viewer, xbox), periods && (await periods), source).find((e) => e.id === viewer)
  if (!own) return entries
  const listed = own.listed && own.points > 0
  const rank = own.points > 0 ? 1 + entries.filter((e) => e.points > own.points).length : 0
  return [...entries, { ...own, listed, rank }]
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

export type Presence = { online: boolean; lastSeenAt: string | null }

/** Online and last seen for the users shown, under the same rule as everywhere (presenceColumns). */
export async function presenceOf(userIds: number[]): Promise<Map<number, Presence>> {
  if (userIds.length === 0) return new Map()
  const rows = await queryRows<Presence & { id: number }>(`SELECT id, ${presenceColumns()} FROM users WHERE id = ANY($1::int[])`, [userIds])
  return new Map(rows.map((r) => [r.id, { online: r.online, lastSeenAt: r.lastSeenAt }]))
}
