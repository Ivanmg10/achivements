'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type OpenCard = { openKey: string | null; setOpenKey: (key: string | null) => void }

const OpenCardContext = createContext<OpenCard | null>(null)

/** Around a list of expandable cards: at most one of them is open at a time. */
export function OpenCardProvider({ children }: { children: ReactNode }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const value = useMemo(() => ({ openKey, setOpenKey }), [openKey])
  return <OpenCardContext.Provider value={value}>{children}</OpenCardContext.Provider>
}

/** null outside a provider: a card then keeps its own state. */
export const useOpenCardContext = () => useContext(OpenCardContext)
