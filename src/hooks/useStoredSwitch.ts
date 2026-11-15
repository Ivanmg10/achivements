import { useCallback } from 'react'
import { useStoredChoice } from '@/hooks/useStoredChoice'

/**
 * An on/off preference remembered in this browser, stored as the words `off` and `on`
 * (the stored values are synced keys: never rename them). Off until the browser's value is read.
 */
export function useStoredSwitch(key: string, off: string, on: string) {
  const [mode, setMode] = useStoredChoice(key, [off, on], off)
  const set = useCallback((next: boolean) => setMode(next ? on : off), [setMode, on, off])
  return [mode === on, set] as const
}
