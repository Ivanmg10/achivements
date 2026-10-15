import { NextResponse } from 'next/server'
import { requireXboxSession } from '@/lib/apiAuth'
import { xboxFailure, xboxSummary } from '@/lib/xboxClient'

/** The signed-in user's Xbox headline numbers: gamertag, gamerscore, achievements unlocked, games. */
export async function GET(req?: Request) {
  const auth = await requireXboxSession(req)
  if (!auth.ok) return auth.response

  try {
    return NextResponse.json(await xboxSummary(auth.session.xboxxuid, auth.session.xboxgamertag, auth.session.id))
  } catch (err) {
    return xboxFailure(err, 'xbox/summary')
  }
}
