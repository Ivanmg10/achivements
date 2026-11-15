import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useReducedMotion } from 'framer-motion'
import { useStorageValue } from '@/hooks/useStorageValue'
import { CURTAIN_MS, CURTAIN_SWAP_MS } from '@/hooks/useWelcomeSteps'

/** Set (in this tab) while the curtain is carrying a new account from sign-up to the welcome. */
export const ENTRY_KEY = 'welcome-entry'

/**
 * The way in from sign-up: the page that created the account shows the
 * curtain (when `animate`), and `go()` leaves for `/welcome` once it covers the
 * screen; the welcome then plays the rest (`useWelcomeArrival`). With reduced
 * motion it simply goes.
 */
export function useWelcomeEntry() {
  const router = useRouter()
  const reducedMotion = useReducedMotion()
  const [, store] = useStorageValue(ENTRY_KEY, 'session')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const go = useCallback(() => {
    const leave = () => {
      router.push('/welcome')
      router.refresh()
    }
    if (reducedMotion) return leave()
    store('1')
    router.prefetch('/welcome')
    timer.current = setTimeout(leave, CURTAIN_SWAP_MS)
  }, [router, reducedMotion, store])

  return { go, animate: !reducedMotion }
}

/**
 * On the welcome: true while the curtain that came from sign-up is still to
 * finish, so the page shows its second half and then forgets it.
 */
export function useWelcomeArrival(): boolean {
  const [entry, store] = useStorageValue(ENTRY_KEY, 'session')
  const arriving = entry === '1'

  useEffect(() => {
    if (!arriving) return
    const timer = setTimeout(() => store(null), CURTAIN_MS - CURTAIN_SWAP_MS)
    return () => clearTimeout(timer)
  }, [arriving, store])

  return arriving
}
