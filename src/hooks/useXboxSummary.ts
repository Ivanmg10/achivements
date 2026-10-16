import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { xboxErrorFrom, type XboxLinkError } from '@/hooks/useXboxLink'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import type { XboxSummary } from '@/types/xbox'
import { fetchShared } from '@/lib/fetchShared'

/** The linked Xbox account's headline numbers: avatar, gamerscore, achievements unlocked, games. */
export function useXboxSummary() {
  const { data: session } = useSession()
  const enabled = useXboxEnabled()
  const subject = useSubject()
  const xuid = enabled ? (session?.user?.xboxxuid ?? null) : null

  const [summary, setSummary] = useState<XboxSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<XboxLinkError | null>(null)
  const hasFetched = useRef<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchShared(withSubject('/api/xbox/summary', subject))
      if (!res.ok) {
        setError(await xboxErrorFrom(res))
        return
      }
      setSummary((await res.json()) as XboxSummary)
    } catch (err) {
      console.error('[useXboxSummary]', err)
      setError('failed')
    } finally {
      setIsLoading(false)
    }
  }, [subject])

  useEffect(() => {
    if (!xuid) {
      hasFetched.current = null
      return
    }
    if (hasFetched.current === xuid) return
    hasFetched.current = xuid
    load()
  }, [xuid, load])

  // Unlinked, whatever the last account left behind is not shown.
  return {
    summary: xuid ? summary : null,
    isLoading,
    error: xuid ? error : null,
    retry: load,
  }
}
