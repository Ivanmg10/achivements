'use client'

import { createContext, useContext, useState } from 'react'

type MainView = 'panels' | 'recent'

const MainViewContext = createContext<{
  view: MainView
  setView: (v: MainView) => void
} | null>(null)

export function MainViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<MainView>('panels')
  return (
    <MainViewContext.Provider value={{ view, setView }}>
      {children}
    </MainViewContext.Provider>
  )
}

export function useMainView() {
  const ctx = useContext(MainViewContext)
  if (!ctx) throw new Error('useMainView must be used inside MainViewProvider')
  return ctx
}
