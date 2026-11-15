import { useEffect, useState } from 'react'

/** At most this long before it says idle anyway: a busy page still gets there. */
const MAX_WAIT_MS = 2000

/**
 * False on the first paint, true once the browser has a moment to spare after
 * it (or MAX_WAIT_MS at most): for work that should be ready soon but must not
 * compete with what is on screen, like the home's other sections (#101). Never
 * for hiding what is shown: this only decides when something starts loading.
 */
export function useWhenIdle(): boolean {
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: MAX_WAIT_MS })
      return () => window.cancelIdleCallback(id)
    }
    // Safari has no idle callback.
    const timer = setTimeout(() => setIdle(true), MAX_WAIT_MS / 2)
    return () => clearTimeout(timer)
  }, [])

  return idle
}
