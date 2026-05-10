'use client'

import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useLanguage } from '@/context/LanguageContext'
import { GameListRow } from '@/components/ui/GameListRow'
import { SkeletonGameList } from '@/components/ui/SkeletonList'

const ABANDONED_DAYS = 30

export default function MainPageAbandoned({
  playing,
  isLoading,
}: {
  playing: RetroAchievementsGameCompleted[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()
  const [lastAchDates, setLastAchDates] = useState<Record<number, string>>({})
  const [fetchedKey, setFetchedKey] = useState('')
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const allIdsKey = useMemo(() => playing.map((g) => g.GameID).join(','), [playing])

  const doFetch = useCallback((key: string) => {
    if (!key) return
    fetchWithRetry(`/api/getGamesLastPlayed?gameIds=${key}`)
      .then((data) => {
        if (typeof data === 'object' && data) {
          setLastAchDates(data as Record<number, string>)
          setFetchedKey(key)
          attemptRef.current = 0
        }
      })
      .catch(() => {
        const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
        attemptRef.current++
        retryTimer.current = setTimeout(() => doFetch(key), delay)
      })
  }, [])

  useEffect(() => {
    if (!allIdsKey) return
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    setFetchedKey('')
    doFetch(allIdsKey)
  }, [allIdsKey, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const abandoned = useMemo(() => {
    const now = new Date()
    return playing
      .map((g) => {
        const dateStr = lastAchDates[g.GameID]
        const last = dateStr ? new Date(dateStr.replace(' ', 'T')) : null
        const daysAgo = last
          ? Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
          : null
        return { ...g, daysAgo }
      })
      .filter((g): g is typeof g & { daysAgo: number } => g.daysAgo !== null && g.daysAgo >= ABANDONED_DAYS)
      .sort((a, b) => b.daysAgo - a.daysAgo)
  }, [playing, lastAchDates])

  const datesNotReady = allIdsKey !== '' && fetchedKey !== allIdsKey
  const loading = isLoading || datesNotReady

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">
        {T.cards.abandoned} — {ABANDONED_DAYS}{T.cards.abandonedIdle}
      </p>

      {loading ? (
        <SkeletonGameList count={3} />
      ) : abandoned.length === 0 ? (
        <div className="flex items-center justify-center py-4 text-text-secondary text-sm">
          {T.cards.noAbandonedGames}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {abandoned.slice(0, 6).map((g) => (
            <GameListRow
              key={g.GameID}
              href={`/gameInfo/${g.GameID}`}
              imageUrl={g.ImageIcon ? `https://retroachievements.org${g.ImageIcon}` : undefined}
              imageAlt={g.Title}
              title={g.Title}
              subtitle={g.ConsoleName}
              stat={`${g.daysAgo}d`}
              statLabel={`${Math.round(parseFloat(g.PctWon) * 100)}%`}
              statClassName="text-orange-400"
            />
          ))}
        </div>
      )}
    </div>
  )
}
