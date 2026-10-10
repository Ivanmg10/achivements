import { useState } from 'react'

/**
 * Runs `onChange` while rendering, the first time and whenever `deps` differ
 * from the last render's — for state that has to start over when something it
 * depends on changes (a modal that opens, a session that ends).
 *
 * This is React's own alternative to an effect that only calls setState: the
 * component re-renders at once with the new state instead of painting the old
 * one first. `onChange` may set state of this component and nothing else; side
 * effects (timers, focus, fetches) still belong in an effect.
 */
export function useWhenChanged(deps: readonly unknown[], onChange: () => void): void {
  const [seen, setSeen] = useState<readonly unknown[] | null>(null)
  if (seen === null || deps.length !== seen.length || deps.some((d, i) => !Object.is(d, seen[i]))) {
    setSeen(deps)
    onChange()
  }
}
