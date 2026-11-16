import { NextRequest } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { psnGameResponse } from '@/lib/psnRoutes'

/**
 * One game's trophies and trophy groups (base game, each DLC) for the signed-in user: ?id=NPWR12345_00&lang=es,
 * from the snapshot (#179): 202 while its trophies are first read. The same answer as /api/psn/game/[npwr].
 */
export async function GET(req: NextRequest) {
  const auth = await requirePsnSession(req)
  if (!auth.ok) return auth.response
  return psnGameResponse(auth.session, req.nextUrl.searchParams.get('id') ?? '', req.nextUrl.searchParams.get('lang'), 'psn/trophies')
}
