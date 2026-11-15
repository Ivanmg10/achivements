import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { withPlaying, type FriendDetails, type FriendOverview, type PlayingNow } from '@/utils/friends'

import { keepAnswer, lastAnswer } from '@/lib/lastAnswers'
import { useAuthSession } from '@/hooks/useAuthSession'

export { DETAIL_LIMIT } from '@/utils/friends'
export type { FriendDetails } from '@/utils/friends'

export type FriendCards = { friends: FriendOverview[]; details: Record<string, FriendDetails> }

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

/**
 * The cards, ready (`/api/follows/cards`): the list and the activity and games of
 * the newest DETAIL_LIMIT, read on the server in one answer (#101).
 */
export async function loadCards(lang: string, who: 'following' | 'followers' = 'following'): Promise<FriendCards> {
  const res = await fetch(`/api/follows/cards?lang=${lang}${who === 'followers' ? '&who=followers' : ''}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`/api/follows/cards ${res.status}`)
  const data = (await res.json()) as FriendCards
  if (!Array.isArray(data?.friends) || !data.details || typeof data.details !== 'object') throw new Error('/api/follows/cards: unexpected answer')
  return data
}

/**
 * The Friends section's data: everyone you follow, with the activity and games
 * of the newest DETAIL_LIMIT, in one answer that lands whole (see loadCards).
 * Nothing is asked until `enabled` first turns true — the section is opened —
 * and it is kept after.
 */
export function useFriendsData(enabled: boolean) {
  const { lang } = useLanguage()
  const user = useAuthSession().data?.user?.id
  const cardsUrl = `/api/follows/cards?lang=${lang}`
  // Coming back: the cards as they showed, at once, while they are read again (lastAnswers).
  const [friends, setFriends] = useState<FriendOverview[] | null>(() => lastAnswer<FriendCards>(user, cardsUrl)?.friends ?? null)
  const [details, setDetails] = useState<Record<string, FriendDetails>>(() => lastAnswer<FriendCards>(user, cardsUrl)?.details ?? {})
  const [playing, setPlaying] = useState<PlayingNow>({})
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const started = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || started.current === attempt) return
    started.current = attempt
    let current = true
    let finished = false
    loadCards(lang)
      .then((cards) => {
        keepAnswer(user, cardsUrl, cards)
        if (!current) return
        setFriends(cards.friends)
        setDetails(cards.details)
        if (cards.friends.some((f) => f.steam)) {
          loadPlaying().then((p) => {
            if (current) setPlaying(p)
          })
        }
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
  }, [enabled, attempt, lang, user, cardsUrl])

  const retry = useCallback(() => {
    setError(false)
    setFriends(null)
    setDetails({})
    setPlaying({})
    setAttempt((n) => n + 1)
  }, [])

  const withGames = useMemo(() => (friends ? withPlaying(friends, playing) : null), [friends, playing])
  return {
    friends: withGames,
    details,
    isLoading: friends === null && !error,
    /** The details come with the list now; kept so a section can wait on "everything" as before. */
    detailsLoading: friends === null && !error,
    error,
    retry,
  }
}
