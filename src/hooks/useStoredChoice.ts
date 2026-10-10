import { useCallback } from 'react'
import { useStorageValue } from '@/hooks/useStorageValue'

/**
 * A choice among fixed options, remembered in this browser — e.g. which
 * profile tab was last open. The default until the browser's value is read
 * (so server and client render the same); a missing, stale or unreadable value
 * falls back to the default.
 */
export function useStoredChoice<T extends string>(key: string, options: readonly T[], fallback: T) {
  const [saved, save] = useStorageValue(key)
  const value = saved && (options as readonly string[]).includes(saved) ? (saved as T) : fallback
  const choose = useCallback((next: T) => save(next), [save])
  return [value, choose] as const
}
