'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useShowcase } from '@/hooks/useShowcase'

type Showcase = ReturnType<typeof useShowcase>

const Ctx = createContext<Showcase | null>(null)

/**
 * The signed-in user's own showcase, loaded once for the whole app: the
 * Pinned section's showcase and every "add to showcase" button share it, so
 * a button shows at once what the section holds. (A public profile reads the
 * other user's with useShowcase directly.)
 */
export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const showcase = useShowcase()
  const { items, isLoading, error, retry, has, add, remove, reorder, full } = showcase
  const value = useMemo(
    () => ({ items, isLoading, error, retry, has, add, remove, reorder, full }),
    [items, isLoading, error, retry, has, add, remove, reorder, full],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** The user's own showcase; null outside the app's providers (a signed-out page). */
export const useOwnShowcase = () => useContext(Ctx)
