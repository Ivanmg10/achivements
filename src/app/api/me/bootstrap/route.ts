import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { loadBootstrap } from '@/lib/meBootstrap'
import { canUseXbox } from '@/utils/xboxAccess'

/**
 * The signed-in user's own CheevoVault data for start-up, in one answer (see
 * loadBootstrap). Only the database, never a platform; only the viewer's own.
 * A part that failed is null, and its reader asks its own route.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized', retryable: false }, { status: 401 })

  const body = await loadBootstrap(String(session.user.id), canUseXbox(session.user.admin))
  return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } })
}
