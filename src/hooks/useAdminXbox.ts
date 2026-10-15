import { useCallback, useState } from 'react'
import { adminFetch } from '@/utils/adminFetch'
import type { XboxGame, XboxProfile } from '@/types/xbox'

/** Why a lookup failed, as /api/admin/xbox says it. */
export type XboxLookupError =
  | 'invalid-gamertag'
  | 'not-found'
  | 'private'
  | 'not-configured'
  | 'unauthorized'
  | 'rate-limited'
  | 'failed'

export type XboxRateLimit = { remaining: number; limit: number } | null

export type XboxLookup = { profile: XboxProfile; games: XboxGame[]; rateLimit: XboxRateLimit }

const KNOWN: XboxLookupError[] = ['invalid-gamertag', 'not-found', 'private', 'not-configured', 'unauthorized', 'rate-limited']

/** The admin Xbox explorer's lookup: a gamertag in, a profile and its library out. */
export function useAdminXbox() {
  const [result, setResult] = useState<XboxLookup | null>(null)
  const [error, setError] = useState<XboxLookupError | null>(null)
  const [loading, setLoading] = useState(false)

  const lookup = useCallback(async (gamertag: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminFetch(`/api/admin/xbox?gamertag=${encodeURIComponent(gamertag)}`)
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setResult(null)
        setError(KNOWN.find((e) => e === data?.error) ?? 'failed')
        return
      }
      setResult((await res.json()) as XboxLookup)
    } catch (err) {
      console.error('[useAdminXbox] lookup', err)
      setResult(null)
      setError('failed')
    } finally {
      setLoading(false)
    }
  }, [])

  return { result, error, loading, lookup }
}
