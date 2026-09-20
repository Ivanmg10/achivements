import { NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getPlayerSummaries } from '@/lib/steamClient'
import { cachedJson } from '@/lib/httpCache'
import type { SteamPlayerSummariesResponse, SteamPlayerSummary } from '@/types/steam'

/** Steam answers with an empty players array for a bad id — not an error status. */
function firstPlayer(data: unknown): SteamPlayerSummary | null {
  return (data as SteamPlayerSummariesResponse)?.response?.players?.[0] ?? null
}

export async function GET() {
  const auth = await requireSteamSession()
  if (!auth.ok) return auth.response
  const { id, steamid, apiKey } = auth.session

  try {
    const player = await withSteamCache(
      `steamProfile:${steamid}`,
      TTL.profile,
      async () => firstPlayer(await getPlayerSummaries(steamid, apiKey)),
      { userId: id, shouldCache: (p) => p !== null },
    )

    if (!player) {
      return NextResponse.json({ message: 'Steam profile not found' }, { status: 404 })
    }

    return cachedJson(player, TTL.profile)
  } catch (err) {
    console.error('[steam/profile]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
