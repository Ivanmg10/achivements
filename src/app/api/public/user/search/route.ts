import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { withCache } from '@/lib/raCache'
import { cachedJson } from '@/lib/httpCache'
import { requireViewerApiKey } from '@/lib/apiAuth'
import { getUserProfile } from '@/lib/raClient'

const TTL = 5 * 60 * 1000

export async function GET(req: NextRequest) {
  const auth = await requireViewerApiKey()
  if (!auth.ok) return auth.response

  const username = req.nextUrl.searchParams.get('u')
  if (!username || username.trim().length < 2) {
    return NextResponse.json({ message: 'Missing username' }, { status: 400 })
  }

  const q = username.trim()

  try {
    const data = await withCache(
      `publicSearch:${q.toLowerCase()}`,
      TTL,
      () => getUserProfile(q, auth.apiKey),
      (d) => d !== null && typeof d === 'object' && 'User' in (d as object),
    )
    return cachedJson(data, TTL)
  } catch {
    return NextResponse.json({ message: 'User not found' }, { status: 404 })
  }
}
