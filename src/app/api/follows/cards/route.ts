import { NextRequest, NextResponse } from 'next/server'
import { GET as overview } from '@/app/api/follows/overview/route'
import { loadFriendCards } from '@/lib/friendCards'
import { DETAIL_LIMIT, type FriendOverview } from '@/utils/friends'

/** People read at a time: the pace each list had in the browser (one for the people you follow: Xbox's budget). */
const AT_ONCE = { following: 1, followers: 2 } as const

/**
 * The Following cards, ready: who you follow (or `?who=followers`, who follows
 * you; only you ever see either) from /api/follows/overview, and the activity and
 * games of the newest DETAIL_LIMIT, in one answer that lands whole, as the
 * section shows it (#101). Who is in a Steam game now stays its own request.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const who = params.get('who') === 'followers' ? 'followers' : 'following'
  const lang = params.get('lang') ?? 'en'

  // The overview's own rules: signed in, public profiles only, Xbox for admins.
  const listRes = await overview(new NextRequest(new URL(`/api/follows/overview${who === 'followers' ? '?who=followers' : ''}`, req.nextUrl.origin)))
  if (!listRes.ok) return listRes
  const friends = (await listRes.json()) as FriendOverview[]
  if (!Array.isArray(friends)) return NextResponse.json({ error: 'failed', retryable: true }, { status: 502 })

  const details = await loadFriendCards(req.nextUrl.origin, friends.slice(0, DETAIL_LIMIT), lang, AT_ONCE[who])
  return NextResponse.json({ friends, details }, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } })
}
