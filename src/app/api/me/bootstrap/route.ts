import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/apiAuth'
import { loadBootstrap } from '@/lib/meBootstrap'
import { canUseXbox } from '@/utils/xboxAccess'

/**
 * The signed-in user's own CheevoVault data for start-up, in one answer (see
 * loadBootstrap). Only the database, never a platform; only the viewer's own.
 * A part that failed is null, and its reader asks its own route.
 */
export async function GET() {
  const auth = await requireSession({ error: 'unauthorized', retryable: false })
  if (!auth.ok) return auth.response

  const body = await loadBootstrap(String(auth.id), canUseXbox(auth.user.admin))
  return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } })
}
