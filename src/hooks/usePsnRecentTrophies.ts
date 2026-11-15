import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { psnErrorFrom, type PsnError } from '@/hooks/usePsnLink'
import type { PsnRecentTrophy } from '@/types/psn'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { fetchShared } from '@/lib/fetchShared'
import { useHiddenGames } from '@/context/HiddenGamesContext'

export type PsnTrophyScope = 'recent' | 'activity' | 'year'
type Outcome = { trophies: PsnRecentTrophy[] } | { error: PsnError } | { syncing: number }

/** Seconds to wait before asking again for a list still being built, when the server does not say. */
const SYNC_WAIT_S = 15

/**
 * The player's PSN trophies, like useSteamRecentAchievements: the latest few
 * (`recent`, for the profile column), the last 60 days (`activity`, for the
 * main page's charts) or the last year (`year`, for the streak). `null` loads
 * nothing. The year and the 60 days are built on the server in the background
 * the first time (202): the hook stays loading and asks again until they land whole.
 */
export function usePsnRecentTrophies(scope: PsnTrophyScope | null = 'recent') {
  const { data: session } = useSession()
  const subject = useSubject()
  const { isHidden } = useHiddenGames()
  const accountId = session?.user?.psnaccountid ?? null
  const { lang } = useLanguage()
  const key = accountId && scope ? `${accountId}:${scope}:${lang}` : null

  const [trophies, setTrophies] = useState<PsnRecentTrophy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<PsnError | null>(null)
  /** Which account and scope the list (or error) belongs to. */
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  /** Asks the server; what came back, not yet applied. */
  const request = useCallback(
    async (forKey: string): Promise<Outcome> => {
      try {
        // From the end: on a public profile the account part is "subject:<name>", colon included.
        const [forScope, forLang] = forKey.split(':').slice(-2)
        const res = await fetchShared(withSubject(`/api/psn/recentTrophies?scope=${forScope}&lang=${forLang}`, subject), { cache: 'no-store' })
        if (res.status === 202) return { syncing: Number(res.headers.get('Retry-After')) || SYNC_WAIT_S }
        if (!res.ok) return { error: await psnErrorFrom(res) }
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('Unexpected PSN response')
        return { trophies: data as PsnRecentTrophy[] }
      } catch (err) {
        console.error('[usePsnRecentTrophies]', err)
        return { error: 'failed' }
      }
    },
    [subject],
  )

  const settle = useCallback((forKey: string, outcome: Exclude<Outcome, { syncing: number }>) => {
    if ('error' in outcome) {
      setError(outcome.error)
    } else {
      setTrophies(outcome.trophies)
      setError(null)
    }
    setIsLoading(false)
    setLoadedKey(forKey)
  }, [])

  /** Asks until the answer is not "still building", then applies it; returns how to stop asking. */
  const ask = useCallback(
    (forKey: string) => {
      let current = true
      let timer: ReturnType<typeof setTimeout> | undefined
      const once = () =>
        request(forKey).then((outcome) => {
          if (!current) return
          if ('syncing' in outcome) timer = setTimeout(once, outcome.syncing * 1000)
          else settle(forKey, outcome)
        })
      once()
      return () => {
        current = false
        clearTimeout(timer)
      }
    },
    [request, settle],
  )

  // A slower answer for a previous account must not land on top.
  useEffect(() => (key ? ask(key) : undefined), [key, ask])

  const retry = useCallback(() => {
    if (!key) return
    setIsLoading(true)
    setError(null)
    ask(key)
  }, [key, ask])

  const ready = Boolean(key) && loadedKey === key
  const visible = useMemo(() => trophies.filter((trophy) => !isHidden(trophy.gameId, 'psn')), [trophies, isHidden])
  return {
    trophies: ready ? visible : [],
    isLoading: Boolean(key) && (isLoading || !ready),
    error: ready ? error : null,
    retry,
  }
}
