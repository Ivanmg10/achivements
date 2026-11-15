'use client'

import { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react'
import { useAuthSession } from '@/hooks/useAuthSession'
import { RecentlyPlayedGame } from '@/types/types'
import { useSubject } from '@/context/SubjectContext'
import { useRetryingRead } from '@/hooks/useRetryingRead'
import { withSubject } from '@/utils/withSubject'
import { useHiddenGames } from '@/context/HiddenGamesContext'

type CtxType = {
  games: RecentlyPlayedGame[]
  isLoading: boolean
  error: boolean
  refetch: () => void
}

type ProviderValue = CtxType & { request: () => void }

const Ctx = createContext<ProviderValue>({ games: [], isLoading: true, error: false, refetch: () => {}, request: () => {} })

const NONE: RecentlyPlayedGame[] = []
const asGames = (data: unknown) => (Array.isArray(data) ? (data as RecentlyPlayedGame[]) : null)

/** RA's recently played games, loaded on first use like RecentAchievementsContext (#101). */
export function RecentlyPlayedGamesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useAuthSession()
  const subject = useSubject()
  const { isHidden } = useHiddenGames()
  const [wanted, setWanted] = useState(false)
  const request = useCallback(() => setWanted(true), [])
  // No RetroAchievements account means nothing to ask for.
  const canFetch = status === 'authenticated' && Boolean(session?.user?.rausername)
  const read = useRetryingRead(canFetch && wanted ? withSubject('/api/getRecentlyPlayedGames', subject) : null, { parse: asGames })
  const games = read.data ?? NONE
  const isLoading = status === 'loading' || (canFetch && (!wanted || read.isLoading))
  const { error, refetch } = read

  // One object per change of what it holds, so a re-render of the provider (the session updating)
  // does not re-render everything that reads it.
  const visibleGames = useMemo(() => games.filter((game) => !isHidden(game.GameID, 'ra')), [games, isHidden])
  const value = useMemo(() => ({ games: visibleGames, isLoading, error, refetch, request }), [visibleGames, isLoading, error, refetch, request])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Reading the list is what asks for it: the first reader starts the load. */
export function useRecentlyPlayedGames(): CtxType {
  const { request, ...value } = useContext(Ctx)
  useEffect(request, [request])
  return value
}
