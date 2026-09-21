import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Session } from 'next-auth'

/** Where the Connect control points. A full page load, so it is a link, not JS. */
export const STEAM_LINK_URL = '/api/steam/link'

/** Outcomes the Steam OpenID callback reports back through `?steam=`. */
export type SteamLinkStatus = 'linked' | 'alreadyLinked' | 'cancelled' | 'failed' | null

/**
 * The callback route reports precise reasons so failures are greppable in logs,
 * but a user only needs to know "it worked", "that account is taken", "you
 * cancelled" or "it broke" — the rest collapse into `failed`.
 */
const STATUS_BY_PARAM: Record<string, Exclude<SteamLinkStatus, null>> = {
  linked: 'linked',
  already_linked: 'alreadyLinked',
  cancelled: 'cancelled',
  invalid_state: 'failed',
  invalid_assertion: 'failed',
  invalid_identity: 'failed',
  unauthorized: 'failed',
  error: 'failed',
}

/**
 * Owns the Steam account link: starting it, reading the outcome the OpenID
 * callback redirected back with, pulling the stored link into the JWT session,
 * and unlinking.
 */
export function useSteamLink() {
  const { data: session, status: sessionStatus, update } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<SteamLinkStatus>(null)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const handled = useRef(false)

  const steamParam = searchParams.get('steam')

  useEffect(() => {
    if (!steamParam || handled.current) return
    const next = STATUS_BY_PARAM[steamParam] ?? 'failed'

    if (next !== 'linked') {
      handled.current = true
      setStatus(next)
      // Drop ?steam= so a refresh does not replay the message.
      router.replace(pathname)
      return
    }

    // next-auth's update() silently does nothing while the session is still
    // loading — and it always is right after the full-page redirect back from
    // Steam. Wait for it, or the link is saved in the DB but never reaches the JWT.
    if (sessionStatus !== 'authenticated') return
    handled.current = true
    router.replace(pathname)

    // The redirect could not write the JWT cookie, so read the stored link and
    // push it into the session. "Linked" is only shown once the session holds it.
    ;(async () => {
      try {
        const res = await fetch('/api/steam/account')
        if (!res.ok) throw new Error(`Failed to read Steam account (${res.status})`)
        const data = (await res.json()) as { steamid: string | null; steamusername: string | null }
        if (!data.steamid) throw new Error('Steam account was not stored')

        const updated = await update({ steamid: data.steamid, steamusername: data.steamusername } as Partial<Session>)
        // update() resolves without throwing when it skips, so check the link landed.
        if (updated?.user?.steamid !== data.steamid) throw new Error('Session did not take the Steam link')

        setStatus('linked')
      } catch (err) {
        console.error('[useSteamLink] refresh', err)
        setStatus('failed')
      }
    })()
  }, [steamParam, sessionStatus, pathname, router, update])

  const disconnect = useCallback(async () => {
    setIsUnlinking(true)
    try {
      const res = await fetch('/api/steam/unlink', { method: 'POST' })
      if (!res.ok) throw new Error(`Failed to unlink Steam (${res.status})`)
      const updated = await update({ steamid: null, steamusername: null } as Partial<Session>)
      // Same silent-skip risk as linking: the DB is cleared, make sure the session is too.
      if (!updated || updated.user?.steamid) throw new Error('Session still holds the Steam link')
      setStatus(null)
    } catch (err) {
      console.error('[useSteamLink] disconnect', err)
      setStatus('failed')
    } finally {
      setIsUnlinking(false)
    }
  }, [update])

  const dismiss = useCallback(() => setStatus(null), [])

  return {
    steamId: session?.user?.steamid ?? null,
    steamUsername: session?.user?.steamusername ?? null,
    isLinked: Boolean(session?.user?.steamid),
    status,
    isUnlinking,
    disconnect,
    dismiss,
  }
}
