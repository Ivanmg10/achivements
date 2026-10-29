import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { queryRows } from '@/lib/queryRows'
import { loadRanking, weekStartRanks } from '@/lib/rankings'
import type { GameSource } from '@/types/steam'
import { canUseXbox } from '@/utils/xboxAccess'
import { lastWeeks, monthStart, weekStart } from '@/utils/vaultLevel'

export type VaultMe = {
  /** All time, every platform the viewer may see. */
  points: number
  split: Partial<Record<GameSource, number>>
  week: number
  month: number
  /** Global, all time; 0 with nothing scored. */
  rank: number
  /** Whether others see them in the rankings (public profile and not opted out). */
  listed: boolean
  /** The switch in Preferences, whatever the profile. */
  showInRankings: boolean
  /** Games scored from their library progress, until their achievements are read. */
  provisional: number
  refreshedAt: string | null
  /** Points earned each of the last WEEKS weeks, oldest first (Monday, UTC), zeros included. */
  weeks: { start: string; points: number }[]
  /** Points earned each of the last seven UTC days, oldest first, zeros included. */
  days?: { start: string; points: number }[]
  /** Places gained since Monday's snapshot; null before the first one or when unlisted. */
  rankDelta?: number | null
}

/** How many weeks the history goes back. */
const WEEKS = 12

/** The signed-in user's own Vault Points: for the header, the profile and the rankings panel. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(session.user.id)
  const xbox = canUseXbox(session.user.admin)

  try {
    const now = new Date()
    const weeks = lastWeeks(now, WEEKS)
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const days = Array.from({ length: 7 }, (_, i) => new Date(today - (6 - i) * 86400000).toISOString().slice(0, 10))
    const [entries, user, periods, provisional, weekly, daily, before] = await Promise.all([
      loadRanking({ scope: 'global', period: 'all', source: 'all', viewerId: id, xbox }),
      queryRows<{ show_in_rankings: boolean; profile_public: boolean; score_refreshed_at: string | null }>(
        'SELECT show_in_rankings, profile_public, score_refreshed_at FROM users WHERE id = $1',
        [id],
      ),
      queryRows<{ kind: 'w' | 'm'; points: number }>(
        `SELECT kind, SUM(points)::int AS points FROM score_periods
         WHERE user_id = $1 AND ($4::boolean OR source <> 'xbox')
           AND ((kind = 'w' AND start = $2::date) OR (kind = 'm' AND start = $3::date))
         GROUP BY kind`,
        [id, weekStart(now), monthStart(now), xbox],
      ),
      queryRows<{ n: number }>(`SELECT COUNT(*)::int AS n FROM score_games WHERE user_id = $1 AND provisional AND ($2::boolean OR source <> 'xbox')`, [id, xbox]),
      queryRows<{ start: string; points: number }>(
        `SELECT to_char(start, 'YYYY-MM-DD') AS start, SUM(points)::int AS points FROM score_periods
         WHERE user_id = $1 AND kind = 'w' AND start >= $2::date AND ($3::boolean OR source <> 'xbox')
         GROUP BY start`,
        [id, weeks[0], xbox],
      ),
      queryRows<{ start: string; points: number }>(
        `SELECT to_char(to_timestamp((x->>0)::bigint) AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS start,
                ROUND(SUM((x->>1)::numeric * stack_factor::numeric))::int AS points
         FROM score_games, jsonb_array_elements(unlocks) x
         WHERE user_id = $1 AND flag IS DISTINCT FROM 'suspect' AND ($3::boolean OR source <> 'xbox')
           AND (x->>0)::bigint >= EXTRACT(EPOCH FROM $2::date)::bigint
           AND (x->>0)::bigint < EXTRACT(EPOCH FROM ($2::date + interval '7 days'))::bigint
         GROUP BY start`,
        [id, days[0], xbox],
      ),
      weekStartRanks(now),
    ])
    const byWeek = new Map(weekly.map((w) => [w.start, w.points]))
    const byDay = new Map(daily.map((d) => [d.start, d.points]))
    const own = entries.find((e) => e.id === id)
    const previousRank = before.get(id)
    const row = user[0]
    const body: VaultMe = {
      points: own?.totalPoints ?? 0,
      split: own?.split ?? {},
      week: periods.find((p) => p.kind === 'w')?.points ?? 0,
      month: periods.find((p) => p.kind === 'm')?.points ?? 0,
      rank: own?.rank ?? 0,
      listed: Boolean(row?.profile_public && row?.show_in_rankings),
      showInRankings: row?.show_in_rankings !== false,
      provisional: provisional[0]?.n ?? 0,
      refreshedAt: row?.score_refreshed_at ? new Date(row.score_refreshed_at).toISOString() : null,
      weeks: weeks.map((start) => ({ start, points: byWeek.get(start) ?? 0 })),
      days: days.map((start) => ({ start, points: byDay.get(start) ?? 0 })),
      rankDelta: own && previousRank !== undefined ? previousRank - own.rank : null,
    }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[rankings/me GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
