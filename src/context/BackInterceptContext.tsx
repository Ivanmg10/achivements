'use client'

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react'

type Registry = {
  /** Puts a handler in charge of "back" until the returned function is called. The latest one registered wins. */
  register: (handler: () => void) => () => void
  /** Runs the handler in charge, if any. False when there is none: the caller goes back as it normally would. */
  tryHandleBack: () => boolean
}

const NONE: Registry = { register: () => () => {}, tryHandleBack: () => false }

const BackInterceptContext = createContext<Registry>(NONE)

/**
 * Lets a page take over the back button of the top bar while it is showing
 * something that is itself a step forward from where the page opened (a list
 * opened from its shelves): back then undoes that step instead of leaving the
 * page. Holds handlers in a ref, not in state, so registering one never
 * re-renders the bar.
 */
export function BackInterceptProvider({ children }: { children: ReactNode }) {
  const stack = useRef<(() => void)[]>([])

  const register = useCallback((handler: () => void) => {
    stack.current.push(handler)
    return () => {
      stack.current = stack.current.filter((h) => h !== handler)
    }
  }, [])

  const tryHandleBack = useCallback(() => {
    const handler = stack.current[stack.current.length - 1]
    if (!handler) return false
    handler()
    return true
  }, [])

  const value = useMemo(() => ({ register, tryHandleBack }), [register, tryHandleBack])
  return <BackInterceptContext.Provider value={value}>{children}</BackInterceptContext.Provider>
}

/** For the back button: ask first whether the page has a step to undo. Outside a provider, never. */
export const useBackRegistry = () => useContext(BackInterceptContext)
