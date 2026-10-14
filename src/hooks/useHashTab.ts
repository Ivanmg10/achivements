import { useCallback } from 'react'
import { useLocationHash } from '@/hooks/useLocationHash'

/**
 * A tab kept in the page's `#fragment`, so a link can open it and the back
 * button steps through the tabs visited. Anything else in the hash is the
 * first tab. The server and the first paint see the first tab too.
 */
export function useHashTab<T extends string>(tabs: readonly T[]): [T, (tab: T) => void] {
  const hash = useLocationHash().slice(1)
  const tab = (tabs as readonly string[]).includes(hash) ? (hash as T) : tabs[0]
  const setTab = useCallback((next: T) => {
    window.location.hash = next
  }, [])
  return [tab, setTab]
}
