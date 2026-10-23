import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useLocationHash } from '@/hooks/useLocationHash'
import { notify } from '@/lib/notify'

/** How the Steam callback reports a link back to the page it started from. */
const OUTCOMES = ['#steam-linked', '#steam-taken', '#steam-failed']

/**
 * Owns the Steam link: through Steam's own sign-in (`linkHref`, which proves the
 * account is the user's), unlinking, and pulling the result into the session.
 * The link is a trip to Steam, so its outcome comes back as a `#steam-…`
 * fragment on this page, toasted once and cleared.
 */
export function useSteamLink() {
  const { data: session, update } = useSession()
  const { T } = useLanguage()
  const pathname = usePathname()
  const hash = useLocationHash()
  const [isUnlinking, setIsUnlinking] = useState(false)
  const handled = useRef(false)

  useEffect(() => {
    if (!OUTCOMES.includes(hash) || handled.current) return
    handled.current = true
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    if (hash !== '#steam-linked') {
      notify.error(hash === '#steam-taken' ? T.toast.steamLinkTaken : T.toast.steamLinkFailed)
      return
    }
    update()
      .then(() => notify.success(T.toast.steamLinked))
      .catch((err) => {
        console.error('[useSteamLink] session after link', err)
        notify.error(T.toast.steamLinkFailed)
      })
  }, [hash, update, T])

  const unlink = useCallback(async (): Promise<boolean> => {
    setIsUnlinking(true)
    try {
      const res = await fetch('/api/steam/unlink', { method: 'POST' })
      if (!res.ok) throw new Error(`Failed to unlink Steam (${res.status})`)
      const updated = await update()
      // update() resolves without throwing when it skips: make sure the session let go too.
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
    linkHref: `/api/auth/steam?intent=link&next=${encodeURIComponent(pathname || '/user')}`,
    unlink,
    isUnlinking,
  }
}
