import { useCallback, useMemo } from 'react'
import { useStorageValue } from '@/hooks/useStorageValue'
import type { GameSource } from '@/types/steam'

const EMPTY: ReadonlySet<string> = new Set()

function parse(raw: string | null | undefined): ReadonlySet<string> {
  if (!raw) return EMPTY
  try {
    const list: unknown = JSON.parse(raw)
    return Array.isArray(list) ? new Set(list.filter((n): n is string => typeof n === 'string')) : EMPTY
  } catch {
    return EMPTY
  }
}

/**
 * The consoles of one platform the user unticked in preferences, remembered in
 * this browser. Unticked rather than ticked, so a console that shows up later
 * starts out shown. Empty until the browser's value is read (so the server and
 * the client render the same).
 */
export function useHiddenConsoles(source: GameSource) {
  const [raw, save] = useStorageValue(`hidden-consoles:${source}`)
  const hidden = useMemo(() => parse(raw), [raw])

  const store = useCallback(
    (next: Iterable<string>) => {
      const list = [...next]
      save(list.length ? JSON.stringify(list) : null)
    },
    [save],
  )
  const toggle = useCallback(
    (name: string) => {
      const next = new Set(hidden)
      if (!next.delete(name)) next.add(name)
      store(next)
    },
    [hidden, store],
  )
  const hideOnly = useCallback((names: string[]) => store(names), [store])

  return { hidden, toggle, hideOnly, showAll: () => store([]) }
}
