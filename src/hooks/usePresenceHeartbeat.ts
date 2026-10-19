import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

/** How often a visible tab says it is still there. "Online" lasts 5 minutes, so one missed beat does not drop it. */
export const HEARTBEAT_MS = 2 * 60 * 1000

async function beat(): Promise<void> {
  try {
    const res = await fetch('/api/presence', { method: 'POST' })
    if (!res.ok) console.error('[usePresenceHeartbeat]', res.status)
  } catch (err) {
    // Nothing for the user to do: the next beat tries again.
    console.error('[usePresenceHeartbeat]', err)
  }
}

/**
 * Tells the server the signed-in user has CheevoVault in front of them: once
 * on arrival, then every HEARTBEAT_MS and on coming back to the tab, but only
 * while the tab is visible, so a tab left in the background does not count.
 */
export function usePresenceHeartbeat() {
  const { status } = useSession()
  const signedIn = status === 'authenticated'

  useEffect(() => {
    if (!signedIn) return
    const ifVisible = () => {
      if (document.visibilityState === 'visible') void beat()
    }
    ifVisible()
    const timer = setInterval(ifVisible, HEARTBEAT_MS)
    document.addEventListener('visibilitychange', ifVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', ifVisible)
    }
  }, [signedIn])
}
