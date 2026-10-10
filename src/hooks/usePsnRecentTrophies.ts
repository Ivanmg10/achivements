import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { psnErrorFrom, type PsnError } from '@/hooks/usePsnLink'
import type { PsnRecentTrophy } from '@/types/psn'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'

export type PsnTrophyScope = 'recent' | 'activity' | 'year'

/**
 * The player's PSN trophies, like useSteamRecentAchievements: the latest few
 * (`recent`, for the profile column), the last 60 days (`activity`, for the
 * main page's charts) or the last year (`year`, for the streak). `null` loads
 * nothing.
 */
export function usePsnRecentTrophies(scope: PsnTrophyScope | null = 'recent') {
  const { data: session } = useSession()
  const subject = useSubject()
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
    async (forKey: string): Promise<{ trophies: PsnRecentTrophy[] } | { error: PsnError }> => {
      try {
        const [, forScope, forLang] = forKey.split(':')
        const res = await fetch(withSubject(`/api/psn/recentTrophies?scope=${forScope}&lang=${forLang}`, subject), { cache: 'no-store' })
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

  const settle = useCallback((forKey: string, outcome: { trophies: PsnRecentTrophy[] } | { error: PsnError }) => {
    if ('error' in outcome) {
      setError(outcome.error)
    } else {
      setTrophies(outcome.trophies)
      setError(null)
    }
    setIsLoading(false)
    setLoadedKey(forKey)
  }, [])

  useEffect(() => {
    if (!key) return
    // A slower answer for a previous account must not land on top.
    let current = true
    request(key).then((outcome) => {
      if (current) settle(key, outcome)
    })
    return () => {
      current = false
    }
  }, [key, request, settle])

  const retry = useCallback(() => {
    if (!key) return
    setIsLoading(true)
    setError(null)
    request(key).then((outcome) => settle(key, outcome))
  }, [key, request, settle])

  const ready = Boolean(key) && loadedKey === key
  return {
    trophies: ready ? trophies : [],
    isLoading: Boolean(key) && (isLoading || !ready),
    error: ready ? error : null,
    retry,
  }
}
