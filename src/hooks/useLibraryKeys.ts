import { useEffect, useRef } from 'react'

type Keys = {
  /** The search text: Escape clears it. */
  hasQuery: boolean
  onClearQuery: () => void
  /** -1 or 1: the previous or next game of the list. */
  onMove: (step: -1 | 1) => void
  /** The id of the search box, so "/" can reach it. */
  searchId: string
}

const isTyping = (el: Element | null) => !!el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)

/**
 * The library's keyboard: "/" goes to the search, the up and down arrows
 * move through the list, Escape clears the search. Nothing fires while
 * typing, except Escape in the search box.
 */
export function useLibraryKeys(keys: Keys) {
  const latest = useRef(keys)
  useEffect(() => {
    latest.current = keys
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = latest.current
      const typing = isTyping(document.activeElement)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        document.getElementById(k.searchId)?.focus()
      } else if (e.key === 'Escape' && k.hasQuery) {
        k.onClearQuery()
      } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !typing) {
        e.preventDefault()
        k.onMove(e.key === 'ArrowDown' ? 1 : -1)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
}
