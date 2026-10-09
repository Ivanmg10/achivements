import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { psnErrorFrom, type PsnError } from '@/hooks/usePsnLink'
import type { PsnRecentTrophy } from '@/types/psn'

export type PsnTrophyScope = 'recent' | 'activity' | 'year'

/**
 * The player's PSN trophies, like useSteamRecentAchievements: the latest few
 * (`recent`, for the profile column), the last 60 days (`activity`, for the
 * main page's charts) or the last year (`year`, for the streak). `null` loads
 * nothing.
 */
export function usePsnRecentTrophies(scope: PsnTrophyScope | null = 'recent') {
  const { data: session } = useSession()
  const accountId = session?.user?.psnaccountid ?? null
  const { lang } = useLanguage()
  const key = accountId && scope ? `${accountId}:${scope}:${lang}` : null

  const [trophies, setTrophies] = useState<PsnRecentTrophy[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<PsnError | null>(null)
  /** Which account and scope the list (or error) belongs to. */
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  const load = useCallback(
    async (forKey: string, isCurrent: () => boolean = () => true) => {
      setIsLoading(true)
      setError(null)
      try {
        const [, forScope, forLang] = forKey.split(':')
        const res = await fetch(`/api/psn/recentTrophies?scope=${forScope}&lang=${forLang}`, { cache: 'no-store' })
        if (!isCurrent()) return
        if (!res.ok) {
          setError(await psnErrorFrom(res))
          return
        }
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('Unexpected PSN response')
        if (isCurrent()) setTrophies(data as PsnRecentTrophy[])
      } catch (err) {
        console.error('[usePsnRecentTrophies]', err)
        if (isCurrent()) setError('failed')
      } finally {
        if (isCurrent()) {
          setIsLoading(false)
          setLoadedKey(forKey)
        }
      }
    },
    [],
  )

  useEffect(() => {
    if (!key) return
    // A slower answer for a previous account must not land on top.
    let current = true
    load(key, () => current)
    return () => {
      current = false
    }
  }, [key, load])

  const retry = useCallback(() => {
    if (key) load(key)
  }, [key, load])

  const ready = Boolean(key) && loadedKey === key
  return {
    trophies: ready ? trophies : [],
    isLoading: Boolean(key) && (isLoading || !ready),
    error: ready ? error : null,
    retry,
  }
}
