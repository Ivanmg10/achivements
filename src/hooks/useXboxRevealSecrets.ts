import { useCallback } from 'react'
import { useStoredChoice } from '@/hooks/useStoredChoice'

const MODES = ['conceal', 'reveal'] as const

/**
 * Whether secret Xbox achievements start out shown (spoilers) or concealed
 * (the default). Remembered in this browser; the eye on each achievement still
 * flips it for that one.
 */
export function useXboxRevealSecrets() {
  const [mode, setMode] = useStoredChoice('xbox-secret-achievements', MODES, 'conceal')
  const setReveal = useCallback((on: boolean) => setMode(on ? 'reveal' : 'conceal'), [setMode])
  return [mode === 'reveal', setReveal] as const
}
