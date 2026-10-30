import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { RecentAchievement, RetroAchievementsGameCompleted } from '@/types/types'
import type { SteamGameProgress, SteamRecentAchievement } from '@/types/steam'
import type { PsnGameProgress, PsnRecentTrophy } from '@/types/psn'
import type { XboxGameProgress, XboxRecentAchievement } from '@/types/xbox'
import { lastPlayedGame, withPlaying, type FriendOverview, type LastPlayed, type PlayingNow } from '@/utils/friends'
import { profileLibrary, type LibraryGame } from '@/utils/library'
import { toRecentAchievement } from '@/utils/steamMappers'
import { psnToRecentAchievement } from '@/utils/psnMappers'
import { xboxToRecentAchievement } from '@/utils/xboxMappers'
import { toSteamLanguage } from '@/utils/steamLanguage'
import { mapLimit } from '@/utils/utils'

/** How many friends get their activity and games read: the newest follows. Each costs a few cached platform calls. */
export const DETAIL_LIMIT = 10
const AT_ONCE = 1
/** RA's own system "consoles" (events, hubs) are not games. */
const RA_SYSTEM_CONSOLES = new Set([100, 101])

export type FriendDetails = {
  recent: RecentAchievement[]
  games: LibraryGame[]
  lastPlayed: LastPlayed | null
  /** Something could not be read (a private profile, a platform down): the numbers may be short. */
  partial: boolean
}

async function readList<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${url.split('?')[0]} ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data)) throw new Error(`${url.split('?')[0]}: not a list`)
  return data as T[]
}

/** Who is in a Steam game right now. A nice extra on the cards: a failure only logs and shows none. */
export async function loadPlaying(): Promise<PlayingNow> {
  try {
    const res = await fetch('/api/follows/playing', { cache: 'no-store' })
    if (!res.ok) throw new Error(`/api/follows/playing ${res.status}`)
    return (await res.json()) as PlayingNow
  } catch (err) {
    console.error('[useFriendsData] playing', err)
    return {}
  }
}

/** One friend's recent unlocks and games, through the same routes their profile uses (`?user=`). */
export async function loadFriendDetails(friend: FriendOverview, lang: string): Promise<FriendDetails> {
  const user = `user=${encodeURIComponent(friend.username)}`
  const steamLang = toSteamLanguage(lang)
  const none = Promise.resolve([] as never[])
  const calls = await Promise.allSettled([
    friend.ra ? readList<RecentAchievement>(`/api/getRecentAchievements?${user}`) : none,
    friend.steam ? readList<SteamRecentAchievement>(`/api/steam/activity?lang=${steamLang}&${user}`) : none,
    friend.psn ? readList<PsnRecentTrophy>(`/api/psn/recentTrophies?scope=activity&lang=${lang}&${user}`) : none,
    friend.ra ? readList<RetroAchievementsGameCompleted>(`/api/getGamesCompleted?${user}`) : none,
    friend.steam ? readList<SteamGameProgress>(`/api/steam/ownedGames?${user}`) : none,
    friend.psn ? readList<PsnGameProgress>(`/api/psn/titles?${user}`) : none,
    // Only a viewer who may see Xbox is told the friend has it (see /api/follows/overview).
    friend.xbox ? readList<XboxRecentAchievement>(`/api/xbox/recentAchievements?scope=activity&lang=${lang}&${user}`) : none,
    friend.xbox ? readList<XboxGameProgress>(`/api/xbox/titles?${user}`) : none,
  ])
  const failed = calls.filter((c) => c.status === 'rejected')
  for (const f of failed) console.error('[useFriendsData]', friend.username, (f as PromiseRejectedResult).reason)
  const [raRecent, steamRecent, psnRecent, raGames, steamGames, psnGames, xboxRecent, xboxGames] = calls.map((c) => (c.status === 'fulfilled' ? c.value : []))

  const recent = [
    ...(raRecent as RecentAchievement[]),
    ...(steamRecent as SteamRecentAchievement[]).map(toRecentAchievement),
    ...(psnRecent as PsnRecentTrophy[]).map(psnToRecentAchievement),
    ...(xboxRecent as XboxRecentAchievement[]).map(xboxToRecentAchievement),
  ].sort((a, b) => b.Date.localeCompare(a.Date))
  const games = profileLibrary(
    (raGames as RetroAchievementsGameCompleted[]).filter((g) => !RA_SYSTEM_CONSOLES.has(g.ConsoleID)),
    steamGames as SteamGameProgress[],
    psnGames as PsnGameProgress[],
    [],
    friend.username,
    xboxGames as XboxGameProgress[],
  )
  const lastPlayed = lastPlayedGame(
    raRecent as RecentAchievement[],
    steamGames as SteamGameProgress[],
    psnGames as PsnGameProgress[],
    xboxGames as XboxGameProgress[],
  )
  return { recent, games, lastPlayed, partial: failed.length > 0 }
}

/**
 * The Friends section's data: everyone you follow from our own database (cheap,
 * all of them), then the activity and games of the newest DETAIL_LIMIT, two at
 * at a time, each filled in as it arrives. Nothing is asked until `enabled` first
 * turns true — the section is opened — and it is kept after.
 */
export function useFriendsData(enabled: boolean) {
  const { lang } = useLanguage()
  const [friends, setFriends] = useState<FriendOverview[] | null>(null)
  const [details, setDetails] = useState<Record<string, FriendDetails>>({})
  const [playing, setPlaying] = useState<PlayingNow>({})
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const started = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || started.current === attempt) return
    started.current = attempt
    let current = true
    let finished = false
    readList<FriendOverview>('/api/follows/overview')
      .then(async (list) => {
        if (!current) return
        setFriends(list)
        if (list.some((f) => f.steam)) {
          loadPlaying().then((p) => {
            if (current) setPlaying(p)
          })
        }
        await mapLimit(list.slice(0, DETAIL_LIMIT), AT_ONCE, async (friend) => {
          const d = await loadFriendDetails(friend, lang)
          if (current) setDetails((prev) => ({ ...prev, [friend.username]: d }))
        })
      })
      .catch((err) => {
        console.error('[useFriendsData]', err)
        if (current) setError(true)
      })
      .finally(() => {
        finished = true
      })
    return () => {
      current = false
      // Stopped halfway (a page that wants it from its first render, run twice by Strict Mode): the next run asks again.
      if (!finished) started.current = null
    }
  }, [enabled, attempt, lang])

  const retry = useCallback(() => {
    setError(false)
    setFriends(null)
    setDetails({})
    setPlaying({})
    setAttempt((n) => n + 1)
  }, [])

  const withGames = useMemo(() => (friends ? withPlaying(friends, playing) : null), [friends, playing])
  const detailed = friends ? friends.slice(0, DETAIL_LIMIT) : []
  return {
    friends: withGames,
    details,
    /** The overview is in, and every friend whose details are read has answered. */
    isLoading: friends === null && !error,
    detailsLoading: detailed.some((f) => !details[f.username]),
    error,
    retry,
  }
}
