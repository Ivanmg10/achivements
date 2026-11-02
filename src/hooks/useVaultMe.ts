import { useCallback, useEffect, useState } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { fetchShared } from '@/lib/fetchShared'
import { bootstrapPart } from '@/lib/bootstrapParts'
import { useVaultFillState } from '@/context/VaultFillContext'
import type { VaultMe } from '@/app/api/rankings/me/route'

/** The first read takes the start-up bootstrap's when it has them; every other read asks the route. */
async function request(userId: string | undefined, first: boolean): Promise<VaultMe | null> {
  try {
    const fromBootstrap = first && userId ? await bootstrapPart(userId, 'vault') : null
    if (fromBootstrap) return fromBootstrap
    // Shared: the header, the profile and the rankings page may all ask at once.
    const res = await fetchShared('/api/rankings/me')
    if (!res.ok) throw new Error(`rankings/me ${res.status}`)
    const data = await res.json()
    if (typeof data?.points !== 'number') throw new Error('Unexpected Vault Points')
    return data as VaultMe
  } catch (err) {
    console.error('[useVaultMe]', err)
    return null
  }
}

/**
 * The signed-in user's own Vault Points: total, per platform, this week and
 * month, global place, and whether others see them listed. Nothing is asked
 * signed out. `error` when they could not be read.
 */
export function useVaultMe() {
  const { status, data: session } = useAuthSession()
  const signedIn = status === 'authenticated'
  const userId = session?.user?.id
  const [me, setMe] = useState<VaultMe | null>(null)
  const [answered, setAnswered] = useState(false)
  const [attempt, setAttempt] = useState(0)
  // After every pass of the fill, the points may have moved.
  const fillVersion = useVaultFillState()?.version ?? 0

  useEffect(() => {
    if (!signedIn) return
    let current = true
    request(userId, attempt === 0 && fillVersion === 0).then((data) => {
      if (!current) return
      setMe(data)
      setAnswered(true)
    })
    return () => {
      current = false
    }
  }, [signedIn, userId, attempt, fillVersion])

  const retry = useCallback(() => {
    setAnswered(false)
    setAttempt((n) => n + 1)
  }, [])

  /** After the switch in Preferences saved: shown at once, then read again (being listed also depends on the profile). */
  const setShowInRankings = useCallback((show: boolean) => {
    setMe((m) => (m ? { ...m, showInRankings: show } : m))
    setAttempt((n) => n + 1)
  }, [])

  // Loading while the session is read too: a block that holds its room must hold it from the first paint.
  const isLoading = (signedIn || status === 'loading') && !answered

  return { me, isLoading, error: signedIn && answered && me === null, retry, setShowInRankings }
}
