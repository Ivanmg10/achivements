import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { fetchShared } from '@/lib/fetchShared'
import { useVaultFillState } from '@/context/VaultFillContext'
import type { VaultMe } from '@/app/api/rankings/me/route'

async function request(): Promise<VaultMe | null> {
  try {
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
  const { status } = useSession()
  const signedIn = status === 'authenticated'
  const [me, setMe] = useState<VaultMe | null>(null)
  const [answered, setAnswered] = useState(false)
  const [attempt, setAttempt] = useState(0)
  // After every pass of the fill, the points may have moved.
  const fillVersion = useVaultFillState()?.version ?? 0

  useEffect(() => {
    if (!signedIn) return
    let current = true
    request().then((data) => {
      if (!current) return
      setMe(data)
      setAnswered(true)
    })
    return () => {
      current = false
    }
  }, [signedIn, attempt, fillVersion])

  const retry = useCallback(() => {
    setAnswered(false)
    setAttempt((n) => n + 1)
  }, [])

  /** After the switch in Preferences saved: shown at once, then read again (being listed also depends on the profile). */
  const setShowInRankings = useCallback((show: boolean) => {
    setMe((m) => (m ? { ...m, showInRankings: show } : m))
    setAttempt((n) => n + 1)
  }, [])

  return { me, isLoading: signedIn && !answered, error: signedIn && answered && me === null, retry, setShowInRankings }
}
