import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

/**
 * Whether the page has scrolled more than `px` down: a bar that is clear over a page's top and takes its ground
 * once the page moves. False on the server and while hydrating, so the first paint is the top's.
 */
export function useScrolledPast(px: number): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.scrollY > px,
    () => false,
  )
}
