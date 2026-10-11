import { useSyncExternalStore } from 'react'

/**
 * Whether a CSS media query matches, following it as the window changes.
 * False on the server and while hydrating, so server and client render the same.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia?.(query)
      list?.addEventListener('change', notify)
      return () => list?.removeEventListener('change', notify)
    },
    () => window.matchMedia?.(query).matches ?? false,
    () => false,
  )
}
