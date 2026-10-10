import { useSyncExternalStore } from 'react'

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

/** The page's `#fragment` (with the `#`), '' when there is none and on the server; follows the user changing it. */
export function useLocationHash(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash, () => '')
}
