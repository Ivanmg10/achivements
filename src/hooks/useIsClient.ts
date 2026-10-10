import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * False while rendering on the server and while hydrating, true after: for what
 * only exists in the browser (a portal into document.body) without an effect
 * that sets state, and without a mismatch between the two renders.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
