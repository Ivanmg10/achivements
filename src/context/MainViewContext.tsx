'use client'

import { createContext, useContext, useState } from 'react'

type MainView = 'pinned' | 'recent'

const MainViewContext = createContext<{
  view: MainView
  setView: (v: MainView) => void
} | null>(null)

export function MainViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<MainView>('recent')
  return (
    <MainViewContext.Provider value={{ view, setView }}>
      {children}
    </MainViewContext.Provider>
  )
}

/** The view, or null where the app's providers are not mounted (a signed-out visitor's loading screen). */
export function useOptionalMainView() {
  return useContext(MainViewContext)
}

export function useMainView() {
  const ctx = useContext(MainViewContext)
  if (!ctx) throw new Error('useMainView must be used inside MainViewProvider')
  return ctx
}
