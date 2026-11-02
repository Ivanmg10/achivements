import { useEffect, useState } from 'react'

/** The welcome's look choices, in their order on the Style step. */
export const LOOK_CHOICES = ['theme', 'shape', 'font', 'home', 'cards', 'language'] as const
export type LookChoice = (typeof LOOK_CHOICES)[number]

/** Which choice an entry of the browser's history has open, beside `useWelcomeSteps`' own step. */
const HISTORY_KEY = 'welcomeChoice'

function fromHistory(state: unknown): LookChoice | null {
  const value = (state as Record<string, unknown> | null)?.[HISTORY_KEY]
  return (LOOK_CHOICES as readonly unknown[]).includes(value) ? (value as LookChoice) : null
}

/**
 * Which look choice of the Style step is open. Opening one is an entry in the
 * browser's history, so its back button closes it rather than leaving the step;
 * going between choices replaces that entry, so back never walks through them.
 * `returnTo` is the choice just closed, for its row to take the focus again.
 */
export function useWelcomeChoice() {
  const [{ open, returnTo }, setState] = useState<{ open: LookChoice | null; returnTo: LookChoice | null }>({ open: null, returnTo: null })

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const choice = fromHistory(e.state)
      setState((s) => ({ open: choice, returnTo: choice ? null : s.open }))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  function show(choice: LookChoice) {
    window.history.pushState({ ...window.history.state, [HISTORY_KEY]: choice }, '')
    setState({ open: choice, returnTo: null })
  }

  function go(choice: LookChoice) {
    window.history.replaceState({ ...window.history.state, [HISTORY_KEY]: choice }, '')
    setState({ open: choice, returnTo: null })
  }

  function close() {
    // Its entry is still there unless a reload lost the state that pointed to it.
    if (fromHistory(window.history.state)) window.history.back()
    else setState((s) => ({ open: null, returnTo: s.open }))
  }

  return { open, returnTo, show, go, close }
}
