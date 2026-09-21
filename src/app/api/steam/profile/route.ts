import { NextResponse } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { withSteamCache, TTL } from '@/lib/steamCache'
import { getPlayerSummaries, getSteamLevel } from '@/lib/steamClient'
import { cachedJson } from '@/lib/httpCache'
import type { SteamPlayerSummariesResponse, SteamPlayerSummary, SteamProfile } from '@/types/steam'

/** Steam answers with an empty players array for a bad id — not an error status. */
function firstPlayer(data: unknown): SteamPlayerSummary | null {
  return (data as SteamPlayerSummariesResponse)?.response?.players?.[0] ?? null
}

/** The level is extra: if Steam will not give it, the profile still shows. */
async function loadLevel(steamid: string, apiKey: string): Promise<number | null> {
  try {
    const data = (await getSteamLevel(steamid, apiKey)) as { response?: { player_level?: number } }
    return typeof data?.response?.player_level === 'number' ? data.response.player_level : null
  } catch (err) {
    console.error('[steam/profile] level', err)
    return null
  }
}

export async function GET() {
  const auth = await requireSteamSession()
  if (!auth.ok) return auth.response
  const { id, steamid, apiKey } = auth.session

  try {
    const profile = await withSteamCache<SteamProfile | null>(
      // v2: the cached shape gained `level`.
      `steamProfile_v2:${steamid}`,
      TTL.profile,
      async () => {
        const [summaries, level] = await Promise.all([getPlayerSummaries(steamid, apiKey), loadLevel(steamid, apiKey)])
        const player = firstPlayer(summaries)
        return player ? { ...player, level } : null
      },
      { userId: id, shouldCache: (p) => p !== null },
    )

    if (!profile) {
      return NextResponse.json({ message: 'Steam profile not found' }, { status: 404 })
    }

    return cachedJson(profile, TTL.profile)
  } catch (err) {
    console.error('[steam/profile]', err)
    return NextResponse.json({ message: 'Steam API unavailable' }, { status: 503 })
  }
}
