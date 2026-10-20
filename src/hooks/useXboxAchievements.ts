import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { xboxErrorFrom, type XboxLinkError } from '@/hooks/useXboxLink'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import type { XboxAchievement } from '@/types/xbox'
import { fetchShared } from '@/lib/fetchShared'

/**
 * One Xbox game's achievements for the signed-in user, by Xbox's title id
 * ("1738914043"), in the app's language. Null loads nothing.
 */
export function useXboxAchievements(titleId: string | null) {
  const { lang } = useLanguage()
  const subject = useSubject()
  const key = titleId ? `${titleId}:${lang}` : null
  const [achievements, setAchievements] = useState<XboxAchievement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<XboxLinkError | null>(null)
  /** The game the current achievements (or error) belong to. */
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const hasFetched = useRef<string | null>(null)

  const load = useCallback(async () => {
    if (!titleId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchShared(withSubject(`/api/xbox/achievements?id=${encodeURIComponent(titleId)}&lang=${lang}`, subject))
      if (!res.ok) {
        setError(await xboxErrorFrom(res))
        return
      }
      const data = (await res.json()) as { achievements?: XboxAchievement[] }
      if (!Array.isArray(data.achievements)) throw new Error('Unexpected Xbox response')
      setAchievements(data.achievements)
    } catch (err) {
      console.error('[useXboxAchievements]', err)
      setError('failed')
    } finally {
      setIsLoading(false)
      setLoadedFor(`${titleId}:${lang}`)
    }
  }, [titleId, lang, subject])

  useEffect(() => {
    if (!key || hasFetched.current === key) return
    hasFetched.current = key
    load()
  }, [key, load])

  return {
    achievements: key ? achievements : [],
    isLoading: Boolean(key) && (isLoading || loadedFor !== key),
    error: key ? error : null,
    retry: load,
  }
}
