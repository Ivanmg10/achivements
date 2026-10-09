import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'

/** Why a link attempt failed, as /api/steam/link reports it. Keys of T.steamLink.errors. */
export type SteamLinkError = 'invalid-query' | 'not-found' | 'private' | 'not-configured' | 'failed'

const KNOWN: SteamLinkError[] = ['invalid-query', 'not-found', 'private', 'not-configured', 'failed']

/**
 * Owns the Steam link: linking by custom URL name, profile link or SteamID64
 * (like PSN, no Steam sign-in), unlinking, and pulling the result into the
 * session. The link is one POST, so its outcome comes straight back here.
 */
export function useSteamLink() {
  const { data: session, update } = useSession()

  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [error, setError] = useState<SteamLinkError | null>(null)

  const link = useCallback(
    async (query: string): Promise<boolean> => {
      setIsLinking(true)
      setError(null)
      try {
        const res = await fetch('/api/steam/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          setError(KNOWN.find((code) => code === body?.error) ?? 'failed')
          return false
        }
        const data = (await res.json()) as { steamid: string }
        const updated = await update()
        // update() resolves without throwing when it skips, so check the link landed.
        if (updated?.user?.steamid !== data.steamid) throw new Error('Session did not take the Steam link')
        return true
      } catch (err) {
        console.error('[useSteamLink] link', err)
        setError('failed')
        return false
      } finally {
        setIsLinking(false)
      }
    },
    [update],
  )

  const unlink = useCallback(async (): Promise<boolean> => {
    setIsUnlinking(true)
    try {
      const res = await fetch('/api/steam/unlink', { method: 'POST' })
      if (!res.ok) throw new Error(`Failed to unlink Steam (${res.status})`)
      const updated = await update()
      // Same silent-skip risk as linking: the DB is cleared, make sure the session is too.
      if (!updated || updated.user?.steamid) throw new Error('Session still holds the Steam link')
      return true
    } catch (err) {
      console.error('[useSteamLink] unlink', err)
      return false
    } finally {
      setIsUnlinking(false)
    }
  }, [update])

  return {
    steamId: session?.user?.steamid ?? null,
    steamUsername: session?.user?.steamusername ?? null,
    isLinked: Boolean(session?.user?.steamid),
    link,
    isLinking,
    error,
    unlink,
    isUnlinking,
  }
}
