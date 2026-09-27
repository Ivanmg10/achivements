import { useCallback, useEffect, useState } from 'react'

/**
 * A choice among fixed options, remembered in this browser — e.g. which
 * profile tab was last open. Read after mount so server and client render the
 * same; a missing, stale or unreadable value falls back to the default.
 */
export function useStoredChoice<T extends string>(key: string, options: readonly T[], fallback: T) {
  const [value, setValue] = useState<T>(fallback)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key)
      if (saved && (options as readonly string[]).includes(saved)) setValue(saved as T)
    } catch {
      // Storage unavailable (private mode, blocked): keep the default.
    }
    // options is a fixed list per call site; re-reading on its identity is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const choose = useCallback(
    (next: T) => {
      setValue(next)
      try {
        window.localStorage.setItem(key, next)
      } catch {
        // Not remembered — the choice itself still applies.
      }
    },
    [key],
  )

  return [value, choose] as const
}
