import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePlatformRead } from '@/hooks/usePlatformRead'
import { useWhenChanged } from '@/hooks/useWhenChanged'

type Issued = { verified: boolean; code: string | null; expiresAt: string | null }

/** The `{ error }` code of a failed answer, as the route sent it: the screen puts it in words (psnVerifyError). */
async function codeFrom(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: unknown } | null
  return typeof body?.error === 'string' ? body.error : 'failed'
}

const SPEC = { tag: 'usePsnVerification', errorFrom: codeFrom }

/**
 * Whether the linked PSN account is proven to be the user's (#176): the code to paste in its About Me and
 * `check`, which asks the server to read it. The state is the session's (`psnVerified`, rebuilt from the row);
 * the code is asked for only while the account is not verified, since asking makes one.
 */
export function usePsnVerification() {
  const { data: session, update } = useSession()
  const accountId = session?.user?.psnaccountid ?? null
  const sessionVerified = Boolean(accountId) && session?.user?.psnVerified === true

  const [confirmed, setConfirmed] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Another account (or none) starts over.
  useWhenChanged([accountId], () => {
    setConfirmed(false)
    setError(null)
  })

  const read = usePlatformRead<Issued, string>(accountId && !sessionVerified && !confirmed ? '/api/psn/verify' : null, SPEC)
  const { retry } = read
  const verified = sessionVerified || confirmed || read.data?.verified === true

  const check = useCallback(async (): Promise<boolean> => {
    setChecking(true)
    setError(null)
    try {
      const res = await fetch('/api/psn/verify', { method: 'POST' })
      if (!res.ok) {
        const code = await codeFrom(res)
        setError(code)
        // An expired code is replaced by the next read.
        if (code === 'no-code') retry()
        return false
      }
      setConfirmed(true)
      await update()
      return true
    } catch (err) {
      console.error('[usePsnVerification] check', err)
      setError('failed')
      return false
    } finally {
      setChecking(false)
    }
  }, [update, retry])

  return {
    linked: accountId !== null,
    verified,
    code: read.data?.code ?? null,
    isLoading: read.isLoading,
    loadError: read.error,
    retry,
    checking,
    error,
    check,
  }
}
