import { NextResponse } from 'next/server'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { findXboxGame, isTitleId, isXuid, xboxFailure, xboxGameAchievements, xboxRateLimit } from '@/lib/xboxClient'
import { withXboxTelemetry } from '@/lib/xboxTelemetry'

/** Admin-only: one game's achievements for an account, from the explorer. */
async function get(req: Request) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const params = new URL(req.url).searchParams
  const xuid = params.get('xuid')
  const titleId = params.get('titleId')
  if (!isXuid(xuid) || !isTitleId(titleId)) return NextResponse.json({ error: 'invalid-request' }, { status: 400 })

  try {
    // From the library, which says which endpoint the game is on and when it was last played (the cache key).
    const game = await findXboxGame(xuid, titleId)
    if (!game) return NextResponse.json({ error: 'not-in-library' }, { status: 404 })
    const achievements = await xboxGameAchievements(xuid, game)
    await logAdminAction(auth.admin, 'xbox-achievements', null, { xuid, titleId })
    return NextResponse.json({ achievements, rateLimit: xboxRateLimit() })
  } catch (err) {
    return xboxFailure(err, 'admin/xbox/achievements')
  }
}

export async function GET(req: Request) {
  return withXboxTelemetry('admin/xbox/achievements', () => get(req))
}
