import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { xboxErrorFrom, type XboxLinkError } from '@/hooks/useXboxLink'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import type { XboxRecentAchievement } from '@/types/xbox'
import { fetchShared } from '@/lib/fetchShared'

export type XboxAchievementScope = 'recent' | 'activity' | 'year'

/**
 * The player's Xbox achievements, like usePsnRecentTrophies: the latest few
 * (`recent`, for the profile column), the last 60 days (`activity`, for the
 * main page's charts) or the last year (`year`, for the streak). `null` loads
 * nothing.
 */
export function useXboxRecentAchievements(scope: XboxAchievementScope | null = 'recent') {
  const { data: session } = useSession()
  const enabled = useXboxEnabled()
  const subject = useSubject()
  const xuid = enabled ? (session?.user?.xboxxuid ?? null) : null
  const { lang } = useLanguage()
  const key = xuid && scope ? `${xuid}:${scope}:${lang}` : null

  const [achievements, setAchievements] = useState<XboxRecentAchievement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<XboxLinkError | null>(null)
  /** Which account and scope the list (or error) belongs to. */
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  /** Asks the server; what came back, not yet applied. */
  const request = useCallback(
    async (forKey: string): Promise<{ achievements: XboxRecentAchievement[] } | { error: XboxLinkError }> => {
      try {
        // From the end: on a public profile the account part is "subject:<name>", colon included.
        const [forScope, forLang] = forKey.split(':').slice(-2)
        const res = await fetchShared(withSubject(`/api/xbox/recentAchievements?scope=${forScope}&lang=${forLang}`, subject), { cache: 'no-store' })
        if (!res.ok) return { error: await xboxErrorFrom(res) }
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('Unexpected Xbox response')
        return { achievements: data as XboxRecentAchievement[] }
      } catch (err) {
        console.error('[useXboxRecentAchievements]', err)
        return { error: 'failed' }
      }
    },
    [subject],
  )

  const settle = useCallback((forKey: string, outcome: { achievements: XboxRecentAchievement[] } | { error: XboxLinkError }) => {
    if ('error' in outcome) {
      setError(outcome.error)
    } else {
      setAchievements(outcome.achievements)
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
    achievements: ready ? achievements : [],
    isLoading: Boolean(key) && (isLoading || !ready),
    error: ready ? error : null,
    retry,
  }
}
