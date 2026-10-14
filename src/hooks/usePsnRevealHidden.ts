import { useCallback } from 'react'
import { useStoredChoice } from '@/hooks/useStoredChoice'

const MODES = ['conceal', 'reveal'] as const

/**
 * Whether hidden PSN trophies start out shown (spoilers) or concealed (the
 * default). Remembered in this browser; the eye on each trophy still flips it
 * for that trophy.
 */
export function usePsnRevealHidden() {
  const [mode, setMode] = useStoredChoice('psn-hidden-trophies', MODES, 'conceal')
  const setReveal = useCallback((on: boolean) => setMode(on ? 'reveal' : 'conceal'), [setMode])
  return [mode === 'reveal', setReveal] as const
}
