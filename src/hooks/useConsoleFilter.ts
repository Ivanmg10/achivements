import { useState } from 'react'

export function useConsoleFilter(initialIds?: number[]) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialIds ?? []),
  )

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function clear() {
    setSelected(new Set())
  }

  return { selected, toggle, clear }
}
