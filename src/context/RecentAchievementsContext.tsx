'use client'

import { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react'
import { RecentAchievement } from '@/types/types'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useSubject } from '@/context/SubjectContext'
import { useRetryingRead } from '@/hooks/useRetryingRead'
import { withSubject } from '@/utils/withSubject'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { parseUnlockTime } from '@/utils/dates'

type CtxType = {
  achievements: RecentAchievement[]
  isLoading: boolean
  error: boolean
  refetch: () => void
}

type ProviderValue = CtxType & { request: () => void }

const Ctx = createContext<ProviderValue>({ achievements: [], isLoading: true, error: false, refetch: () => {}, request: () => {} })

const NONE: RecentAchievement[] = []
const newestFirst = (data: unknown) =>
  Array.isArray(data) ? [...(data as RecentAchievement[])].sort((a, b) => parseUnlockTime(b.Date) - parseUnlockTime(a.Date)) : null

/**
 * The latest unlocks, shared by the home page and the account page. Loaded on
 * first use rather than on every route: a game or status page never reads it,
 * and should not wait on RA for it.
 */
export function RecentAchievementsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useAuthSession()
  const subject = useSubject()
  const { isHidden } = useHiddenGames()
  const [wanted, setWanted] = useState(false)
  const request = useCallback(() => setWanted(true), [])
  const canFetch = status === 'authenticated' && Boolean(session?.user?.rausername)
  const read = useRetryingRead(canFetch && wanted ? withSubject('/api/getRecentAchievements', subject) : null, { parse: newestFirst })
  const achievements = read.data ?? NONE
  const isLoading = status === 'loading' || (canFetch && (!wanted || read.isLoading))
  const { error, refetch } = read

  // One object per change of what it holds, so a re-render of the provider (the session updating)
  // does not re-render everything that reads it.
  const visible = useMemo(() => achievements.filter((achievement) => !isHidden(achievement.GameID, 'ra')), [achievements, isHidden])
  const value = useMemo(() => ({ achievements: visible, isLoading, error, refetch, request }), [visible, isLoading, error, refetch, request])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Reading the list is what asks for it: the first reader starts the load. */
export function useRecentAchievements(): CtxType {
  const { request, ...value } = useContext(Ctx)
  useEffect(request, [request])
  return value
}
