import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'

/** Why a link attempt failed, as /api/psn/link reports it. Keys of T.psn.errors. */
export type PsnError = 'invalid-username' | 'not-found' | 'private' | 'not-configured' | 'failed'

const KNOWN: PsnError[] = ['invalid-username', 'not-found', 'private', 'not-configured', 'failed']

/** Reads the `{ error }` code from a failed PSN response; anything unexpected is 'failed'. */
export async function psnErrorFrom(res: Response): Promise<PsnError> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  return KNOWN.find((code) => code === body?.error) ?? 'failed'
}

/**
 * Owns the PSN link: linking by online ID, unlinking, and pulling the result
 * into the session. Unlike Steam there is no redirect — the link is one POST,
 * so its outcome comes straight back here.
 */
export function usePsnLink() {
  const { data: session, update } = useSession()

  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [error, setError] = useState<PsnError | null>(null)

  const link = useCallback(
    async (username: string): Promise<boolean> => {
      setIsLinking(true)
      setError(null)
      try {
        const res = await fetch('/api/psn/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })
        if (!res.ok) {
          setError(await psnErrorFrom(res))
          return false
        }
        const data = (await res.json()) as { psnaccountid: string }
        const updated = await update()
        // update() resolves without throwing when it skips, so check the link landed.
        if (updated?.user?.psnaccountid !== data.psnaccountid) throw new Error('Session did not take the PSN link')
        return true
      } catch (err) {
        console.error('[usePsnLink] link', err)
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
      const res = await fetch('/api/psn/unlink', { method: 'POST' })
      if (!res.ok) throw new Error(`Failed to unlink PSN (${res.status})`)
      const updated = await update()
      if (!updated || updated.user?.psnaccountid) throw new Error('Session still holds the PSN link')
      return true
    } catch (err) {
      console.error('[usePsnLink] unlink', err)
      return false
    } finally {
      setIsUnlinking(false)
    }
  }, [update])

  return {
    accountId: session?.user?.psnaccountid ?? null,
    username: session?.user?.psnusername ?? null,
    isLinked: Boolean(session?.user?.psnaccountid),
    link,
    isLinking,
    error,
    unlink,
    isUnlinking,
  }
}
