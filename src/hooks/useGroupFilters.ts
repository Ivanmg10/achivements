import { useCallback, useState } from 'react'
import type { DecadeFilter, GroupFilters, PctFilter } from '@/utils/groupItems'

/** The group page's filters: consoles (any of them), progress and decade. */
export function useGroupFilters() {
  const [consoles, setConsoles] = useState<Set<string>>(new Set())
  const [pct, setPct] = useState<PctFilter>('all')
  const [decade, setDecade] = useState<DecadeFilter>('all')

  const toggleConsole = useCallback((name: string) => {
    setConsoles((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setConsoles(new Set())
    setPct('all')
    setDecade('all')
  }, [])

  const filters: GroupFilters = { consoles, pct, decade }
  const active = pct !== 'all' || decade !== 'all' || consoles.size > 0

  return { filters, active, setPct, setDecade, toggleConsole, clearConsoles: () => setConsoles(new Set()), clear }
}
