import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'

/** Why an Xbox call failed, as the /api/xbox routes report it. Keys of T.xbox.errors. */
export type XboxLinkError = 'invalid-gamertag' | 'not-found' | 'private' | 'not-configured' | 'rate-limited' | 'failed'

const KNOWN: XboxLinkError[] = ['invalid-gamertag', 'not-found', 'private', 'not-configured', 'rate-limited', 'failed']

/** Reads the `{ error }` code from a failed Xbox response; anything unexpected is 'failed'. */
export async function xboxErrorFrom(res: Response): Promise<XboxLinkError> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  return KNOWN.find((code) => code === body?.error) ?? 'failed'
}

/**
 * Owns the Xbox link: linking by gamertag, unlinking, and pulling the result
 * into the session. Like PSN there is no redirect — the link is one POST, so
 * its outcome comes straight back here. `enabled` says whether this person may
 * use Xbox at all (an admin, for now); the page offers nothing otherwise.
 */
export function useXboxLink() {
  const { data: session, update } = useSession()
  const enabled = useXboxEnabled()

  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [error, setError] = useState<XboxLinkError | null>(null)

  const link = useCallback(
    async (gamertag: string): Promise<boolean> => {
      setIsLinking(true)
      setError(null)
      try {
        const res = await fetch('/api/xbox/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gamertag }),
        })
        if (!res.ok) {
          setError(await xboxErrorFrom(res))
          return false
        }
        const data = (await res.json()) as { xboxxuid: string }
        const updated = await update()
        // update() resolves without throwing when it skips, so check the link landed.
        if (updated?.user?.xboxxuid !== data.xboxxuid) throw new Error('Session did not take the Xbox link')
        return true
      } catch (err) {
        console.error('[useXboxLink] link', err)
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
      const res = await fetch('/api/xbox/unlink', { method: 'POST' })
      if (!res.ok) throw new Error(`Failed to unlink Xbox (${res.status})`)
      const updated = await update()
      if (!updated || updated.user?.xboxxuid) throw new Error('Session still holds the Xbox link')
      return true
    } catch (err) {
      console.error('[useXboxLink] unlink', err)
      return false
    } finally {
      setIsUnlinking(false)
    }
  }, [update])

  return {
    enabled,
    xuid: enabled ? (session?.user?.xboxxuid ?? null) : null,
    gamertag: enabled ? (session?.user?.xboxgamertag ?? null) : null,
    isLinked: enabled && Boolean(session?.user?.xboxxuid),
    link,
    isLinking,
    error,
    unlink,
    isUnlinking,
  }
}
