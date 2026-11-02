import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { withPlaying, type FriendDetails, type FriendOverview, type PlayingNow } from '@/utils/friends'
import { loadCards, loadPlaying } from '@/hooks/useFriendsData'

/**
 * The people who follow you, as the Following page's cards show them (public
 * profiles only, newest first), read once `enabled` turns on, and, as for the
 * people you follow, the activity and games of the newest DETAIL_LIMIT (one
 * answer, see loadCards) and who is in a Steam game now: so the two lists draw
 * the same card. Only you ever see this list. `retry` after a failure asks again.
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
    loadCards(lang, 'followers')
      .then((cards) => {
        if (!current) return
        setFollowers(cards.friends)
        setDetails(cards.details)
        if (cards.friends.some((f) => f.steam)) {
          loadPlaying().then((p) => {
            if (current) setPlaying(p)
          })
        }
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
  const isLoading = enabled && followers === null && !failed
  // The details come with the list: "loading" until both are in, as the section waits for.
  return { followers: withGames, details, isLoading, detailsLoading: isLoading, error: failed, retry }
}
