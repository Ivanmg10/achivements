import { NextResponse } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireRaSession } from '@/lib/apiAuth'
import { getTopTenUsers } from '@/lib/raClient'

const TTL = 15 * 60 * 1000

export async function GET() {
  const auth = await requireRaSession()
  if (!auth.ok) return auth.response
  const { raid } = auth.session

  try {
    const data = await withCache(
      'topTenUsers_v1',
      TTL,
      () => getTopTenUsers(raid),
      (d) => Array.isArray(d) && d.length > 0,
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'RA service unavailable' }, { status: 503 })
  }
}
