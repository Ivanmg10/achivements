'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { RecentAchievement } from '@/types/types'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { toRecentAchievement } from '@/utils/steamMappers'
import { usePsnRecentTrophies } from '@/hooks/usePsnRecentTrophies'
import { psnToRecentAchievement } from '@/utils/psnMappers'

type CtxType = {
  achievements: RecentAchievement[]
  isLoading: boolean
  error: boolean
  refetch: () => void
}

const Ctx = createContext<CtxType>({ achievements: [], isLoading: true, error: false, refetch: () => {} })

const byDateDesc = (a: RecentAchievement, b: RecentAchievement) => b.Date.localeCompare(a.Date)

/**
 * A year of unlocks across every linked platform — what the streak is counted
 * from, here and not in the hook so the three places that read it (the header
 * badge, the side panel, the streak page) share one load.
 *
 * Every platform together is the point: a day spent on Steam or PlayStation is
 * a day played, and leaving it out broke streaks that never happened.
 */
export function ActivityHeatmapYearProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const rausername = session?.user?.rausername
  const steamid = session?.user?.steamid
  const [raAchievements, setRaAchievements] = useState<RecentAchievement[]>([])
  const [raLoading, setRaLoading] = useState(true)
  const [raError, setRaError] = useState(false)
  const hasFetched = useRef(false)
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // A year of Steam has to be assembled game by game, so it comes from its own
  // endpoint; the hook already handles the language and the account changing.
  const steam = useSteamRecentAchievements(steamid ? 'year' : null)
  // PSN the same way: Sony has no feed, the server assembles it per game.
  const psn = usePsnRecentTrophies('year')

  const doFetch = useCallback(() => {
    // Named, so a retry can call it again.
    const run = () => {
      if (!rausername) { setRaLoading(false); return }
      setRaLoading(true)
      setRaError(false)
      const onFail = (err?: unknown) => {
        if (!scheduleRetry(attemptRef, retryTimer, run, err)) { setRaError(true); setRaLoading(false) }
      }
      fetchWithRetry('/api/getActivityHeatmapYear')
        .then((data) => {
          if (!Array.isArray(data)) return onFail()
          setRaAchievements(data as RecentAchievement[])
          setRaLoading(false)
          attemptRef.current = 0
        })
        .catch(onFail)
    }
    run()
  }, [rausername])

  useEffect(() => {
    if (!rausername) { setRaLoading(false); return }
    if (hasFetched.current) return
    hasFetched.current = true
    doFetch()
  }, [rausername, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const steamAchievements = useMemo(
    () => steam.achievements.map(toRecentAchievement),
    [steam.achievements],
  )

  const psnAchievements = useMemo(() => psn.trophies.map(psnToRecentAchievement), [psn.trophies])

  const achievements = useMemo(
    () => [...raAchievements, ...steamAchievements, ...psnAchievements].sort(byDateDesc),
    [raAchievements, steamAchievements, psnAchievements],
  )

  const refetch = useCallback(() => {
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setRaAchievements([])
    doFetch()
    steam.retry()
    psn.retry()
  }, [doFetch, steam, psn])

  // One platform failing is not the streak failing: it only counts as an error
  // when nothing came back at all, so a Steam or PSN outage does not hide RA's year.
  const isLoading = raLoading || steam.isLoading || psn.isLoading
  const error = (raError || Boolean(steam.error) || Boolean(psn.error)) && achievements.length === 0

  const value = useMemo(
    () => ({ achievements, isLoading, error, refetch }),
    [achievements, isLoading, error, refetch],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useActivityHeatmapYear = () => useContext(Ctx)
