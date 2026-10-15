import { NextResponse } from 'next/server'
import { logAdminAction, requireAdmin } from '@/lib/adminAuth'
import { findXboxAccount, isGamertag, xboxFailure, xboxLibrary, xboxRateLimit } from '@/lib/xboxClient'

/**
 * Admin-only Xbox explorer: a gamertag in, its profile and library out.
 * Nothing is saved on any account — this is how the OpenXBL integration is
 * tried out before any user can link Xbox. Every lookup is logged.
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const gamertag = new URL(req.url).searchParams.get('gamertag')
  if (!isGamertag(gamertag)) return NextResponse.json({ error: 'invalid-gamertag' }, { status: 400 })

  try {
    const profile = await findXboxAccount(gamertag)
    if (!profile) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    const games = await xboxLibrary(profile.xuid)
    await logAdminAction(auth.admin, 'xbox-lookup', null, { gamertag: profile.gamertag, xuid: profile.xuid })
    return NextResponse.json({ profile, games, rateLimit: xboxRateLimit() })
  } catch (err) {
    return xboxFailure(err, 'admin/xbox')
  }
}
