import { useCallback, useMemo, useState } from 'react'
import type { RevealControl } from '@/types/achievementTable'

/**
 * Which hidden trophies or secret achievements are shown, as the table and the badge grid take it:
 * `byDefault` (the platform's preference, `usePsnRevealHidden` / `useXboxRevealSecrets`) sets the
 * starting point and each eye flips one from it; `setAll` shows or hides a whole list. `idOf` is
 * stable (module level): PSN's ids are numbers, Xbox's strings.
 */
export function useRevealed<T, K extends string | number>(byDefault: boolean, idOf: (item: T) => K): RevealControl<T> {
  const [flipped, setFlipped] = useState<ReadonlySet<K>>(new Set())
  const isRevealed = useCallback((item: T) => byDefault !== flipped.has(idOf(item)), [byDefault, flipped, idOf])
  const toggle = useCallback(
    (item: T) =>
      setFlipped((prev) => {
        const next = new Set(prev)
        const id = idOf(item)
        if (!next.delete(id)) next.add(id)
        return next
      }),
    [idOf],
  )
  const setAll = useCallback(
    (items: T[], reveal: boolean) => setFlipped(new Set(reveal === byDefault ? [] : items.map(idOf))),
    [byDefault, idOf],
  )
  return useMemo(() => ({ isRevealed, toggle, setAll }), [isRevealed, toggle, setAll])
}
