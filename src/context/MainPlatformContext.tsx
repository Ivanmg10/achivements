'use client'

import { createContext, useContext } from 'react'
import { useStoredChoice } from '@/hooks/useStoredChoice'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'

export type MainPlatform = 'ra' | 'steam'
const PLATFORMS: readonly MainPlatform[] = ['ra', 'steam']

const MainPlatformContext = createContext<{
  platform: MainPlatform
  setPlatform: (p: MainPlatform) => void
} | null>(null)

/**
 * Which account's stats the main page shows — the same choice the profile
 * column's tabs make, but shared so the charts section below follows it too.
 * Persisted under the tabs' original key, so an existing choice carries over.
 *
 * Without a linked Steam account it is always RA, whatever was stored — a
 * user who picked Steam and then unlinked it must not get empty Steam stats.
 */
export function MainPlatformProvider({ children }: { children: React.ReactNode }) {
  const [stored, setPlatform] = useStoredChoice<MainPlatform>('main-profile-tab', PLATFORMS, 'ra')
  const { isLinked } = useSteamGamesData()
  const platform: MainPlatform = isLinked ? stored : 'ra'
  return (
    <MainPlatformContext.Provider value={{ platform, setPlatform }}>
      {children}
    </MainPlatformContext.Provider>
  )
}

export function useMainPlatform() {
  const ctx = useContext(MainPlatformContext)
  if (!ctx) throw new Error('useMainPlatform must be used inside MainPlatformProvider')
  return ctx
}
