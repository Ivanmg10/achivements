'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { RecentAchievement } from '@/types/types'
import type { XboxRecentAchievement } from '@/types/xbox'
import type { PsnRecentTrophy } from '@/types/psn'
import { useRetryingRead } from '@/hooks/useRetryingRead'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { toRecentAchievement } from '@/utils/steamMappers'
import { usePsnRecentTrophies } from '@/hooks/usePsnRecentTrophies'
import { psnToRecentAchievement } from '@/utils/psnMappers'
import { useXboxRecentAchievements } from '@/hooks/useXboxRecentAchievements'
import { xboxToRecentAchievement } from '@/utils/xboxMappers'
import { useSubject } from '@/context/SubjectContext'
import { withSubject } from '@/utils/withSubject'
import { useHiddenGames } from '@/context/HiddenGamesContext'

type CtxType = {
  achievements: RecentAchievement[]
  xboxAchievements: XboxRecentAchievement[]
  xboxLoading: boolean
  /** PlayStation's year as Sony's trophies, for what needs their own fields (the home's 60 days, its rarest). */
  psnTrophies: PsnRecentTrophy[]
  psnLoading: boolean
  isLoading: boolean
  error: boolean
  refetch: () => void
}

type ProviderValue = CtxType & { request: () => void }

const Ctx = createContext<ProviderValue>({ achievements: [], xboxAchievements: [], xboxLoading: true, psnTrophies: [], psnLoading: true, isLoading: true, error: false, refetch: () => {}, request: () => {} })

const byDateDesc = (a: RecentAchievement, b: RecentAchievement) => b.Date.localeCompare(a.Date)
const NONE: RecentAchievement[] = []
const asUnlocks = (data: unknown) => (Array.isArray(data) ? (data as RecentAchievement[]) : null)

/**
 * A year of unlocks across every linked platform — what the streak is counted
 * from, here and not in the hook so the three places that read it (the header
 * badge, the side panel, the streak page) share one load.
 *
 * Every platform together is the point: a day spent on Steam or PlayStation is
 * a day played, and leaving it out broke streaks that never happened.
 *
 * Loaded on first use: the header's streak is counted on the server
 * (useStreakSummary), so only what draws the year (the home, the streak page, a
 * profile) asks for it, not every route (#101).
 */
export function ActivityHeatmapYearProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const subject = useSubject()
  const { isHidden } = useHiddenGames()
  const rausername = session?.user?.rausername
  const steamid = session?.user?.steamid
  const [wanted, setWanted] = useState(false)
  const request = useCallback(() => setWanted(true), [])
  const ra = useRetryingRead(rausername && wanted ? withSubject('/api/getActivityHeatmapYear', subject) : null, { parse: asUnlocks })
  const raAchievements = ra.data ?? NONE

  // A year of Steam has to be assembled game by game, so it comes from its own
  // endpoint; the hook already handles the language and the account changing.
  const steam = useSteamRecentAchievements(steamid && wanted ? 'year' : null)
  // PSN the same way: Sony has no feed, the server assembles it per game.
  const psn = usePsnRecentTrophies(wanted ? 'year' : null)
  // And Xbox, which also assembles it per game (nothing is asked unless it is linked and allowed).
  const xbox = useXboxRecentAchievements(wanted ? 'year' : null)

  const steamAchievements = useMemo(
    () => steam.achievements.map(toRecentAchievement),
    [steam.achievements],
  )

  const psnAchievements = useMemo(() => psn.trophies.map(psnToRecentAchievement), [psn.trophies])

  const visibleRa = useMemo(() => raAchievements.filter((achievement) => !isHidden(achievement.GameID, 'ra')), [raAchievements, isHidden])
  const visibleXbox = useMemo(() => xbox.achievements.filter((achievement) => !isHidden(achievement.gameId, 'xbox')), [xbox.achievements, isHidden])
  const xboxAchievements = useMemo(() => visibleXbox.map(xboxToRecentAchievement), [visibleXbox])
  const achievements = useMemo(
    () => [...visibleRa, ...steamAchievements, ...psnAchievements, ...xboxAchievements].sort(byDateDesc),
    [visibleRa, steamAchievements, psnAchievements, xboxAchievements],
  )

  const refetchRa = ra.refetch
  const refetch = useCallback(() => {
    refetchRa()
    steam.retry()
    psn.retry()
    xbox.retry()
  }, [refetchRa, steam, psn, xbox])

  // One platform failing is not the streak failing: it only counts as an error
  // when nothing came back at all, so a Steam or PSN outage does not hide RA's year.
  // Without an RA account there is nothing of RA's to wait for.
  const isLoading = (Boolean(rausername) && (!wanted || ra.isLoading)) || steam.isLoading || psn.isLoading || xbox.isLoading
  const error = (ra.error || Boolean(steam.error) || Boolean(psn.error) || Boolean(xbox.error)) && achievements.length === 0

  const value = useMemo(
    () => ({ achievements, xboxAchievements: visibleXbox, xboxLoading: xbox.isLoading, psnTrophies: psn.trophies, psnLoading: psn.isLoading, isLoading, error, refetch, request }),
    [achievements, visibleXbox, xbox.isLoading, psn.trophies, psn.isLoading, isLoading, error, refetch, request],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Reading the year is what asks for it: the first reader starts the load. */
export function useActivityHeatmapYear(): CtxType {
  const { request, ...value } = useContext(Ctx)
  useEffect(request, [request])
  return value
}
