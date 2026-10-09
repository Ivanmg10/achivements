import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { psnErrorFrom, type PsnError } from '@/hooks/usePsnLink'
import type { PsnSummary } from '@/lib/psnClient'

/** The linked PSN account's headline numbers: avatar, level, trophies by grade, games. */
export function usePsnSummary() {
  const { data: session } = useSession()
  const accountId = session?.user?.psnaccountid ?? null

  const [summary, setSummary] = useState<PsnSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<PsnError | null>(null)
  const hasFetched = useRef<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/psn/summary')
      if (!res.ok) {
        setError(await psnErrorFrom(res))
        return
      }
      setSummary((await res.json()) as PsnSummary)
    } catch (err) {
      console.error('[usePsnSummary]', err)
      setError('failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!accountId) {
      hasFetched.current = null
      return
    }
    if (hasFetched.current === accountId) return
    hasFetched.current = accountId
    load()
  }, [accountId, load])

  // Unlinked, whatever the last account left behind is not shown.
  return {
    summary: accountId ? summary : null,
    isLoading,
    error: accountId ? error : null,
    retry: load,
  }
}
