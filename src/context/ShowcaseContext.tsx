'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useShowcase } from '@/hooks/useShowcase'

type Showcase = ReturnType<typeof useShowcase>

const Ctx = createContext<(Showcase & { request: () => void }) | null>(null)

/**
 * The signed-in user's own showcase, loaded once for the whole app: the
 * Pinned section's showcase and every "add to showcase" button share it, so
 * a button shows at once what the section holds. (A public profile reads the
 * other user's with useShowcase directly.) Loaded on first use (#101).
 */
export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const [wanted, setWanted] = useState(false)
  const request = useCallback(() => setWanted(true), [])
  const showcase = useShowcase(wanted)
  const { items, isLoading, error, retry, has, add, addMany, remove, reorder, full } = showcase
  const value = useMemo(
    () => ({ items, isLoading, error, retry, has, add, addMany, remove, reorder, full, request }),
    [items, isLoading, error, retry, has, add, addMany, remove, reorder, full, request],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** The user's own showcase; null outside the app's providers (a signed-out page). Reading it asks for it. */
export function useOwnShowcase(): Showcase | null {
  const ctx = useContext(Ctx)
  const request = ctx?.request
  useEffect(() => request?.(), [request])
  return ctx
}
