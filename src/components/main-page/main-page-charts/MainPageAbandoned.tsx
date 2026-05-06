'use client'

import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RetroAchievementsGameCompleted } from '@/types/types'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

const ABANDONED_DAYS = 90

export default function MainPageAbandoned({
  playing,
  isLoading,
}: {
  playing: RetroAchievementsGameCompleted[]
  isLoading?: boolean
}) {
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
        Abandoned — {ABANDONED_DAYS}+ days idle
      </p>

      {loading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 bg-bg-main rounded-lg p-2">
              <div className="w-7 h-7 rounded bg-white/10 shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-2.5 w-24 rounded bg-white/10" />
                <div className="h-2 w-16 rounded bg-white/10" />
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="h-2.5 w-8 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : abandoned.length === 0 ? (
        <div className="flex items-center justify-center py-4 text-text-secondary text-sm">
          No abandoned games
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {abandoned.slice(0, 6).map((g) => (
            <Link
              key={g.GameID}
              href={`/gameInfo/${g.GameID}`}
              className="flex items-center gap-2 bg-bg-main rounded-lg p-2 hover:bg-white/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {g.ImageIcon && (
                <Image
                  src={`https://retroachievements.org${g.ImageIcon}`}
                  alt={g.Title}
                  width={28}
                  height={28}
                  className="rounded shrink-0"
                />
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">
                  {g.Title}
                </span>
                <span className="text-[10px] text-text-secondary">{g.ConsoleName}</span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-xs font-bold text-orange-400">{g.daysAgo}d</span>
                <span className="text-[9px] text-text-secondary">
                  {Math.round(parseFloat(g.PctWon) * 100)}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
