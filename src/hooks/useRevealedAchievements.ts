import { useCallback, useState } from 'react'
import { useXboxRevealSecrets } from '@/hooks/useXboxRevealSecrets'

/**
 * Which secret Xbox achievements are shown: the preference sets the starting
 * point and each eye flips one achievement from it. `setAll` shows or hides a
 * whole list. (useRevealedTrophies's counterpart; Xbox ids are strings.)
 */
export function useRevealedAchievements() {
  const [byDefault] = useXboxRevealSecrets()
  const [flipped, setFlipped] = useState<ReadonlySet<string>>(new Set())
  const isRevealed = useCallback((id: string) => byDefault !== flipped.has(id), [byDefault, flipped])
  const toggle = useCallback(
    (id: string) =>
      setFlipped((prev) => {
        const next = new Set(prev)
        if (!next.delete(id)) next.add(id)
        return next
      }),
    [],
  )
  const setAll = useCallback((ids: string[], reveal: boolean) => setFlipped(new Set(reveal === byDefault ? [] : ids)), [byDefault])
  return { isRevealed, toggle, setAll }
}
