import { useState } from 'react'

export function useConsoleFilter(initialIds?: number[]) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialIds ?? []),
  )

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clear() {
    setSelected(new Set())
  }

  return { selected, toggle, clear }
}
