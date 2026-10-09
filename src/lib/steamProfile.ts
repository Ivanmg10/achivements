import { withSteamCache, TTL } from '@/lib/steamCache'
import { getPlayerSummaries, getSteamLevel } from '@/lib/steamClient'
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
    console.error('[steamProfile] level', err)
    return null
  }
}

/**
 * A Steam profile (persona, avatar, level), cached per Steam account. Shared by
 * the signed-in user's own profile and by other users' public pages, so both
 * hit the same cache entry. Null when Steam has no such profile.
 */
export function loadSteamProfile(steamid: string, apiKey: string, userId: string): Promise<SteamProfile | null> {
  return withSteamCache<SteamProfile | null>(
    // v2: the cached shape gained `level`.
    `steamProfile_v2:${steamid}`,
    TTL.profile,
    async () => {
      const [summaries, level] = await Promise.all([getPlayerSummaries(steamid, apiKey), loadLevel(steamid, apiKey)])
      const player = firstPlayer(summaries)
      return player ? { ...player, level } : null
    },
    { userId, shouldCache: (p) => p !== null },
  )
}
