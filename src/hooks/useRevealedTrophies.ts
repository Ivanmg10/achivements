import { useCallback, useState } from 'react'
import { usePsnRevealHidden } from '@/hooks/usePsnRevealHidden'

/**
 * Which hidden trophies are shown: the preference sets the starting point and
 * each eye flips one trophy from it. `setAll` shows or hides a whole list.
 */
export function useRevealedTrophies() {
  const [byDefault] = usePsnRevealHidden()
  const [flipped, setFlipped] = useState<ReadonlySet<number>>(new Set())
  const isRevealed = useCallback((id: number) => byDefault !== flipped.has(id), [byDefault, flipped])
  const toggle = useCallback(
    (id: number) =>
      setFlipped((prev) => {
        const next = new Set(prev)
        if (!next.delete(id)) next.add(id)
        return next
      }),
    [],
  )
  const setAll = useCallback((ids: number[], reveal: boolean) => setFlipped(new Set(reveal === byDefault ? [] : ids)), [byDefault])
  return { isRevealed, toggle, setAll }
}
