import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { withPlaying, type FriendOverview, type PlayingNow } from '@/utils/friends'
import { DETAIL_LIMIT, loadFriendDetails, loadPlaying, type FriendDetails } from '@/hooks/useFriendsData'
import { mapLimit } from '@/utils/utils'

const AT_ONCE = 2

/**
 * The people who follow you, as the Following page's cards show them (public
 * profiles only, newest first), read once `enabled` turns on, and, as for the
 * people you follow, the activity and games of the newest DETAIL_LIMIT and who
 * is in a Steam game now: so the two lists draw the same card. Only you ever
 * see this list. `retry` after a failure asks again.
 */
export function useFollowers(enabled: boolean) {
  const { lang } = useLanguage()
  const [followers, setFollowers] = useState<FriendOverview[] | null>(null)
  const [details, setDetails] = useState<Record<string, FriendDetails>>({})
  const [playing, setPlaying] = useState<PlayingNow>({})
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let current = true
    fetch('/api/follows/overview?who=followers', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`followers ${res.status}`)
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('followers: not a list')
        return data as FriendOverview[]
      })
      .then(async (data) => {
        if (!current) return
        setFollowers(data)
        if (data.some((f) => f.steam)) {
          loadPlaying().then((p) => {
            if (current) setPlaying(p)
          })
        }
        await mapLimit(data.slice(0, DETAIL_LIMIT), AT_ONCE, async (friend) => {
          const d = await loadFriendDetails(friend, lang)
          if (current) setDetails((prev) => ({ ...prev, [friend.username]: d }))
        })
      })
      .catch((err) => {
        console.error('[useFollowers]', err)
        if (current) setFailed(true)
      })
    return () => {
      current = false
    }
  }, [enabled, attempt, lang])

  const retry = useCallback(() => {
    setFailed(false)
    setFollowers(null)
    setDetails({})
    setPlaying({})
    setAttempt((n) => n + 1)
  }, [])

  const withGames = useMemo(() => (followers ? withPlaying(followers, playing) : null), [followers, playing])
  return { followers: withGames, details, isLoading: enabled && followers === null && !failed, error: failed, retry }
}
