import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { psnErrorFrom, type PsnError } from '@/hooks/usePsnLink'
import type { PsnTrophy, PsnTrophyGroup } from '@/types/psn'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'

/**
 * One PSN game's trophies and trophy groups (base game, each DLC) for the
 * signed-in user, by Sony's ID ("NPWR20188_00"), in the app's language.
 * Null loads nothing.
 */
export function usePsnTrophies(titleId: string | null) {
  const { lang } = useLanguage()
  const subject = useSubject()
  const key = titleId ? `${titleId}:${lang}` : null
  const [trophies, setTrophies] = useState<PsnTrophy[]>([])
  const [groups, setGroups] = useState<PsnTrophyGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<PsnError | null>(null)
  /** The game the current trophies (or error) belong to. */
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const hasFetched = useRef<string | null>(null)

  const load = useCallback(async () => {
    if (!titleId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(withSubject(`/api/psn/trophies?id=${encodeURIComponent(titleId)}&lang=${lang}`, subject))
      if (!res.ok) {
        setError(await psnErrorFrom(res))
        return
      }
      const data = (await res.json()) as { trophies?: PsnTrophy[]; groups?: PsnTrophyGroup[] }
      if (!Array.isArray(data.trophies)) throw new Error('Unexpected PSN response')
      setTrophies(data.trophies)
      setGroups(data.groups ?? [])
    } catch (err) {
      console.error('[usePsnTrophies]', err)
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
    trophies: key ? trophies : [],
    groups: key ? groups : [],
    isLoading: Boolean(key) && (isLoading || loadedFor !== key),
    error: key ? error : null,
    retry: load,
  }
}
