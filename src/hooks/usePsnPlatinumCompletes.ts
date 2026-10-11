import { useCallback } from 'react'
import { useStoredChoice } from '@/hooks/useStoredChoice'

const MODES = ['full', 'platinum'] as const

/**
 * Whether a PSN game with its platinum counts as completed, or only the whole
 * set at 100% does (the default). Remembered in this browser, like the theme.
 */
export function usePsnPlatinumCompletes() {
  const [mode, setMode] = useStoredChoice('psn-completion', MODES, 'full')
  const setPlatinumCompletes = useCallback((on: boolean) => setMode(on ? 'platinum' : 'full'), [setMode])
  return [mode === 'platinum', setPlatinumCompletes] as const
}
