import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { isTitleId, isXuid, xboxAchievements, xboxFailure, xboxRateLimit } from '@/lib/xboxClient'

/** Admin-only: one game's achievements for an account, from the explorer. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const params = new URL(req.url).searchParams
  const xuid = params.get('xuid')
  const titleId = params.get('titleId')
  if (!isXuid(xuid) || !isTitleId(titleId)) return NextResponse.json({ error: 'invalid-request' }, { status: 400 })

  try {
    const achievements = await xboxAchievements(xuid, titleId, params.get('is360') === '1')
    return NextResponse.json({ achievements, rateLimit: xboxRateLimit() })
  } catch (err) {
    return xboxFailure(err, 'admin/xbox/achievements')
  }
}
