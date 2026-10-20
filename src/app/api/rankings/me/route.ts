import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { queryRows } from '@/lib/queryRows'
import { loadRanking } from '@/lib/rankings'
import type { GameSource } from '@/types/steam'
import { canUseXbox } from '@/utils/xboxAccess'
import { monthStart, weekStart } from '@/utils/vaultLevel'

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
}

/** The signed-in user's own Vault Points: for the header, the profile and the rankings panel. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(session.user.id)
  const xbox = canUseXbox(session.user.admin)

  try {
    const now = new Date()
    const [entries, user, periods, provisional] = await Promise.all([
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
    ])
    const own = entries.find((e) => e.id === id)
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
    }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[rankings/me GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
