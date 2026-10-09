'use client'

import { createContext, useContext, useMemo } from 'react'
import { useStoredChoice } from '@/hooks/useStoredChoice'
import { useRaLinked } from '@/hooks/useRaLinked'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'

export type MainPlatform = 'ra' | 'steam' | 'psn'
const PLATFORMS: readonly MainPlatform[] = ['ra', 'steam', 'psn']

const MainPlatformContext = createContext<{
  platform: MainPlatform
  setPlatform: (p: MainPlatform) => void
  /** The linked platforms, in tab order. */
  linked: MainPlatform[]
} | null>(null)

/**
 * Which account's stats the main page shows — the same choice the profile
 * column's tabs make, but shared so the charts section below follows it too.
 * Persisted under the tabs' original key, so an existing choice carries over.
 *
 * Only a linked platform can be the choice: a user who picked Steam and then
 * unlinked it must not get empty Steam stats. Then it falls back to the first
 * linked one, RA first (and RA when nothing is linked at all).
 */
export function MainPlatformProvider({ children }: { children: React.ReactNode }) {
  const [stored, setPlatform] = useStoredChoice<MainPlatform>('main-profile-tab', PLATFORMS, 'ra')
  const raLinked = useRaLinked()
  const { isLinked: steamLinked } = useSteamGamesData()
  const { isLinked: psnLinked } = usePsnGamesData()
  const linked = useMemo(
    () => PLATFORMS.filter((p) => (p === 'ra' ? raLinked : p === 'steam' ? steamLinked : psnLinked)),
    [raLinked, steamLinked, psnLinked],
  )
  const platform: MainPlatform = linked.includes(stored) ? stored : linked[0] ?? 'ra'
  return (
    <MainPlatformContext.Provider value={{ platform, setPlatform, linked }}>
      {children}
    </MainPlatformContext.Provider>
  )
}

export function useMainPlatform() {
  const ctx = useContext(MainPlatformContext)
  if (!ctx) throw new Error('useMainPlatform must be used inside MainPlatformProvider')
  return ctx
}
