import { useCallback, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { notify } from '@/lib/notify'

/**
 * Following one user from their page: the state shows at once, and goes back
 * (saying so) if the server refuses. The outcome is told with a toast.
 */
export function useFollow(username: string, initial: boolean) {
  const { T } = useLanguage()
  const [following, setFollowing] = useState(initial)
  const [pending, setPending] = useState(false)

  // Another user, or a fresh answer from the server, starts from what it says.
  useWhenChanged([username, initial], () => setFollowing(initial))

  const toggle = useCallback(async () => {
    const next = !following
    setFollowing(next)
    setPending(true)
    try {
      const res = next
        ? await fetch('/api/follows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
          })
        : await fetch(`/api/follows?username=${encodeURIComponent(username)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`follow ${res.status}`)
      notify.success((next ? T.toast.followed : T.toast.unfollowed).replace('{u}', username))
    } catch (err) {
      console.error('[useFollow]', err)
      setFollowing(!next)
      notify.error(T.toast.followFailed)
    } finally {
      setPending(false)
    }
  }, [following, username, T])

  return { following, pending, toggle }
}
