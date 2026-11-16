import { NextRequest } from 'next/server'
import { requirePsnSession } from '@/lib/apiAuth'
import { psnGameResponse } from '@/lib/psnRoutes'

/** One game's trophies and groups by its trophy set (NPWR12345_00), ?lang=es: from the snapshot, 202 while first read (#179). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ npwr: string }> }) {
  const auth = await requirePsnSession(req)
  if (!auth.ok) return auth.response
  const { npwr } = await params
  return psnGameResponse(auth.session, npwr, req.nextUrl.searchParams.get('lang'), 'psn/game')
}
