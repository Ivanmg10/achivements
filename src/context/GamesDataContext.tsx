'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useSubject } from '@/context/SubjectContext'
import { useRetryingRead } from '@/hooks/useRetryingRead'
import { useHiddenConsoles } from '@/hooks/useHiddenConsoles'
import { consoleOptions, filterByConsole, type ConsoleOption } from '@/utils/consoleFilter'
import { withSubject } from '@/utils/withSubject'
import { useHiddenGames } from '@/context/HiddenGamesContext'

type CtxType = {
  /** Every game, without the consoles unticked in preferences. */
  all: RetroAchievementsGameCompleted[]
  /** The consoles in the list, for the preferences to tick. */
  consoles: ConsoleOption[]
  softcore: RetroAchievementsGameCompleted[]
  hardcore: RetroAchievementsGameCompleted[]
  inProgress: RetroAchievementsGameCompleted[]
  isLoading: boolean
  error: boolean
  /** RetroAchievements does not accept the saved API key (revoked or regenerated): linking again is the fix, not waiting. */
  keyInvalid: boolean
  refetch: () => void
}

type ProviderValue = CtxType & { request: () => void }

const Ctx = createContext<ProviderValue>({
  all: [], consoles: [], softcore: [], hardcore: [], inProgress: [],
  isLoading: true, error: false, keyInvalid: false, refetch: () => {}, request: () => {},
})

const RA_SYSTEM_CONSOLE_IDS = new Set([100, 101])
const NONE: RetroAchievementsGameCompleted[] = []
const realGames = (data: unknown) =>
  Array.isArray(data) ? (data as RetroAchievementsGameCompleted[]).filter((g) => !RA_SYSTEM_CONSOLE_IDS.has(g.ConsoleID)) : null

/**
 * The RA library. Loaded on first use, as RecentAchievementsContext is: a route
 * that never reads it (rankings, groups, following) does not ask RA for it (#101).
 */
export function GamesDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useAuthSession()
  const subject = useSubject()
  const rausername = session?.user?.rausername
  const { hidden } = useHiddenConsoles('ra')
  const { isHidden, isLoading: hiddenLoading } = useHiddenGames()
  const [wanted, setWanted] = useState(false)
  const request = useCallback(() => setWanted(true), [])
  const canFetch = status === 'authenticated' && Boolean(rausername)
  const read = useRetryingRead(canFetch && wanted ? withSubject('/api/getGamesCompleted', subject) : null, { parse: realGames })
  const loaded = read.data ?? NONE
  const isLoading = status === 'loading' || (canFetch && (!wanted || read.isLoading))
  // The routes answer 403 only for a key RA refuses (see raUnavailable).
  const keyInvalid = read.errorStatus === 403
  const { error, refetch } = read

  // The preference is the viewer's own: someone else's list is shown whole.
  const all = useMemo(
    () => hiddenLoading ? [] : (subject ? loaded : filterByConsole(loaded, (g) => g.ConsoleName, hidden)).filter((g) => !isHidden(g.GameID, 'ra')),
    [subject, loaded, hidden, isHidden, hiddenLoading],
  )
  const consoles = useMemo(() => consoleOptions(loaded.map((g) => g.ConsoleName)), [loaded])
  const softcore = useMemo(() => all.filter((g) => g.HardcoreMode === '0'), [all])
  const hardcore = useMemo(() => all.filter((g) => g.HardcoreMode === '1'), [all])
  const inProgress = useMemo(
    () =>
      all
        .filter((g) => Number(g.HardcoreMode) === 0 && parseFloat(g.PctWon) > 0 && parseFloat(g.PctWon) < 1)
        .sort((a, b) => a.GameID - b.GameID),
    [all]
  )

  // One object per change of what it holds, so a re-render of the provider (the session updating)
  // does not re-render everything that reads it.
  const value = useMemo(() => ({ all, consoles, softcore, hardcore, inProgress, isLoading: Boolean(isLoading || hiddenLoading), error, keyInvalid, refetch, request }), [all, consoles, softcore, hardcore, inProgress, isLoading, hiddenLoading, error, keyInvalid, refetch, request])

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  )
}

/** Reading the library is what asks for it: the first reader starts the load. */
export function useGamesData(): CtxType {
  const { request, ...value } = useContext(Ctx)
  useEffect(request, [request])
  return value
}
