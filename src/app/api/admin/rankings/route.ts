import { NextResponse } from 'next/server'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { queryRows } from '@/lib/queryRows'
import { rebuildPeriods } from '@/lib/scoreRefresh'
import { isGameSource } from '@/utils/gameRef'

export type BalanceRow = {
  source: string
  users: number
  games: number
  completed: number
  /** Medians, over games read in full (not provisional). */
  perAchievement: number | null
  perCompleted: number | null
  perUser: number | null
}

export type FlaggedGame = {
  username: string
  userId: number
  source: string
  gameId: number
  title: string
  earned: number
  total: number
  points: number
  flag: 'suspect' | 'cleared'
}

/**
 * The rankings, for admins: how each platform's points compare (the balance
 * every platform is meant to keep, docs/rankings-plan.md), and the games
 * flagged for an unlock tool, to let them count or keep them out.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const [balance, flagged] = await Promise.all([
      queryRows<BalanceRow>(
        `WITH per_user AS (
           SELECT source, user_id, SUM(points * stack_factor) AS points FROM score_games GROUP BY source, user_id
         )
         SELECT g.source, COUNT(DISTINCT g.user_id)::int AS users, COUNT(*)::int AS games,
                COUNT(*) FILTER (WHERE g.completed)::int AS completed,
                ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY g.points::float / g.earned) FILTER (WHERE g.earned > 0 AND NOT g.provisional))::int AS "perAchievement",
                ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY g.points) FILTER (WHERE g.completed AND NOT g.provisional))::int AS "perCompleted",
                (SELECT ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY p.points))::int FROM per_user p WHERE p.source = g.source) AS "perUser"
         FROM score_games g GROUP BY g.source ORDER BY g.source`,
      ),
      queryRows<FlaggedGame>(
        `SELECT u.username, g.user_id AS "userId", g.source, g.game_id::float AS "gameId", g.title, g.earned, g.total, g.points, g.flag
         FROM score_games g JOIN users u ON u.id = g.user_id
         WHERE g.flag IS NOT NULL ORDER BY g.flag DESC, g.updated_at DESC LIMIT 200`,
      ),
    ])
    return NextResponse.json({ balance, flagged })
  } catch (err) {
    console.error('[admin/rankings GET]', err)
    return NextResponse.json({ error: 'Could not read the rankings' }, { status: 500 })
  }
}

// POST { userId, source, gameId, flag: 'cleared' | 'suspect' }: count a flagged game, or keep it out again.
export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const { userId, source, gameId, flag } = body ?? {}
  if (!Number.isInteger(userId) || !isGameSource(source) || !Number.isInteger(gameId) || (flag !== 'cleared' && flag !== 'suspect')) {
    return NextResponse.json({ error: 'invalid-body' }, { status: 400 })
  }

  try {
    const rows = await queryRows<{ username: string; title: string }>(
      `UPDATE score_games g SET flag = $4 FROM users u
       WHERE g.user_id = $1 AND g.source = $2 AND g.game_id = $3 AND g.flag IS NOT NULL AND u.id = g.user_id
       RETURNING u.username, g.title`,
      [userId, source, gameId, flag],
    )
    if (!rows[0]) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    await rebuildPeriods(userId)
    await logAdminAction(auth.admin, 'ranking-flag', { id: userId, username: rows[0].username }, { source, gameId, title: rows[0].title, flag })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/rankings POST]', err)
    return NextResponse.json({ error: 'Could not save the change' }, { status: 500 })
  }
}
