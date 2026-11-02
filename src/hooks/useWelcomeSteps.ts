import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useStorageValue } from '@/hooks/useStorageValue'
import { useLocationHash } from '@/hooks/useLocationHash'

export const WELCOME_STEPS = ['intro', 'ra', 'steam', 'psn', 'profile', 'prefs', 'privacy', 'done'] as const
export type WelcomeStep = (typeof WELCOME_STEPS)[number]

/**
 * The platforms the welcome links, in their order among the steps. A new platform is
 * a new entry here and in WELCOME_STEPS (see CLAUDE.md → Welcome for everything else).
 */
export const PLATFORM_STEPS = ['ra', 'steam', 'psn'] as const satisfies readonly WelcomeStep[]
export type PlatformStep = (typeof PLATFORM_STEPS)[number]

export function isPlatformStep(step: WelcomeStep): step is PlatformStep {
  return (PLATFORM_STEPS as readonly string[]).includes(step)
}

/**
 * The curtain's length (`--curtain` in WelcomeCurtain.module.css), and when the step
 * changes under it, all of it covered then. 2.2 s: the game this is after takes 2.4–3.5 s;
 * 1.1 s felt rushed (the user, 2026-10-22).
 */
export const CURTAIN_MS = 2200
export const CURTAIN_SWAP_MS = 1100

const STORAGE_KEY = 'welcome-progress'
/** Each step's place in the browser's history, under Next's own state (which must be kept). */
const HISTORY_KEY = 'welcomeStep'
const LAST = WELCOME_STEPS.length - 1

type Progress = { step: number; seen: number; skipped: WelcomeStep[] }
const START: Progress = { step: 0, seen: 0, skipped: [] }

export type WelcomeDirection = 'forward' | 'back' | 'none'
export type WelcomeTransition = { from: number; to: number; direction: 'forward' | 'back' }

/** What sessionStorage holds, read defensively: anything odd is a fresh start. */
export function parseProgress(raw: string | null | undefined): Progress {
  if (!raw) return START
  try {
    const p = JSON.parse(raw) as Partial<Progress>
    const inRange = (n: unknown) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= LAST
    if (!inRange(p.step) || !inRange(p.seen)) return START
    const skipped = Array.isArray(p.skipped) ? p.skipped.filter((s): s is WelcomeStep => (WELCOME_STEPS as readonly string[]).includes(s)) : []
    return { step: p.step as number, seen: Math.max(p.seen as number, p.step as number), skipped }
  } catch {
    return START
  }
}

/**
 * Where the welcome is: the step shown, how far the person has been (only
 * those steps can be jumped to), and what they left for later. Kept in this
 * tab's sessionStorage so the round trip to Steam's sign-in lands back on the
 * same step. Moving runs the curtain (`transition`): the step changes halfway,
 * while it is all covered; with reduced motion it changes at once.
 *
 * Every move is also an entry in the browser's history, so its back and
 * forward buttons go through the steps too (a step is in `history.state`, not
 * in the URL: Steam's sign-in answers with its own `#steam-…`).
 */
export function useWelcomeSteps() {
  const reducedMotion = useReducedMotion()
  const [stored, store] = useStorageValue(STORAGE_KEY, 'session')
  const hash = useLocationHash()
  const progress = parseProgress(stored)
  const [transition, setTransition] = useState<WelcomeTransition | null>(null)
  const [direction, setDirection] = useState<WelcomeDirection>('none')
  const [moved, setMoved] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // The page's own entry says which step it shows, so coming back to it lands there.
  const ready = stored !== undefined
  useEffect(() => {
    if (!ready || window.history.state?.[HISTORY_KEY] === progress.step) return
    window.history.replaceState({ ...window.history.state, [HISTORY_KEY]: progress.step }, '')
  }, [ready, progress.step])

  // The browser's back and forward: to the step that entry was, under the curtain.
  const goRef = useRef<(to: number) => void>(() => {})
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const to = e.state?.[HISTORY_KEY]
      if (Number.isInteger(to)) goRef.current(to)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Back from Steam with this tab's progress lost (another tab, storage blocked): the Steam step.
  const steam = WELCOME_STEPS.indexOf('steam')
  useEffect(() => {
    if (!hash.startsWith('#steam-') || stored === undefined || progress.step === steam) return
    store(JSON.stringify({ ...progress, step: steam, seen: Math.max(progress.seen, steam) }))
  }, [hash, stored, progress, steam, store])

  function go(to: number, skipCurrent = false, fromHistory = false) {
    if (transition || to === progress.step || to < 0 || to > LAST) return
    if (!fromHistory) window.history.pushState({ ...window.history.state, [HISTORY_KEY]: to }, '')
    const current = WELCOME_STEPS[progress.step]
    const skipped = skipCurrent
      ? [...progress.skipped.filter((s) => s !== current), current]
      : progress.skipped
    const next: Progress = { step: to, seen: Math.max(progress.seen, to), skipped }
    const dir = to > progress.step ? 'forward' : 'back'
    setMoved(true)
    if (reducedMotion) {
      setDirection('none')
      store(JSON.stringify(next))
      return
    }
    setTransition({ from: progress.step, to, direction: dir })
    timers.current.push(
      setTimeout(() => {
        setDirection(dir)
        store(JSON.stringify(next))
      }, CURTAIN_SWAP_MS),
      setTimeout(() => setTransition(null), CURTAIN_MS),
    )
  }

  useEffect(() => {
    goRef.current = (to: number) => go(to, false, true)
  })

  return {
    index: progress.step,
    step: WELCOME_STEPS[progress.step],
    seen: progress.seen,
    skipped: progress.skipped,
    transition,
    /** Which way the last move went, for the content to come in from that side. */
    direction,
    /** True once the person has moved, so a new step's title can take the focus (not on arrival). */
    moved,
    /** False on the server and while hydrating: the stored step is not known yet. */
    ready,
    goTo: (to: number) => go(to),
    next: () => go(progress.step + 1),
    back: () => go(progress.step - 1),
    /** "Not now" / "skip this step": on to the next, and this one is left for later. */
    skip: () => go(progress.step + 1, true),
    skipAll: () => go(LAST),
    /** Forget the progress (on leaving for the app), so the next welcome starts over. */
    finish: () => store(null),
  }
}
