import { NextRequest } from 'next/server'
import { requireSteamSession } from '@/lib/apiAuth'
import { steamFailure } from '@/lib/steamFailure'
import { loadSteamYear } from '@/lib/steamUnlockYear'
import { parseSteamLanguage } from '@/utils/steamLanguage'
import { cachedJson } from '@/lib/httpCache'
import { visibleGamesForUser } from '@/lib/gameVisibility'

/** Every Steam unlock of the last year — what the streak is built from (see loadSteamYear). */
export async function GET(req: NextRequest) {
  const auth = await requireSteamSession(req)
  if (!auth.ok) return auth.response
  const { id } = auth.session
  const lang = parseSteamLanguage(req.nextUrl.searchParams.get('lang'))

  try {
    const achievements = await loadSteamYear(auth.session, lang)
    // Not browser-cached, like the other Steam lists; the DB cache keeps it cheap.
    const visible = await visibleGamesForUser(id, achievements, 'steam', (achievement) => achievement.appId)
    return cachedJson(visible, 0)
  } catch (err) {
    console.error('[steam/unlockYear]', err)
    return steamFailure(err)
  }
}
