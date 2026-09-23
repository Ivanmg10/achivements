'use client'

import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import { IconMoodEmpty } from '@tabler/icons-react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useLanguage } from '@/context/LanguageContext'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { classifySteamGame } from '@/utils/steamFeed'
import { GameListRow } from '@/components/ui/GameListRow'
import { SkeletonGameList } from '@/components/ui/SkeletonList'
import EmptyState from '@/components/empty-state/EmptyState'

const ABANDONED_DAYS = 30
const DAY_MS = 1000 * 60 * 60 * 24

type Row = { key: string; href: string; imageUrl?: string; title: string; subtitle: string; daysAgo: number; pct: number }

/**
 * Games in progress on either platform, untouched for 30+ days, longest idle
 * first. Steam games come from the library, which already carries the
 * last-played date and counts, so they need none of RA's extra lookups.
 */

export default function MainPageAbandoned({
  playing,
  steamGames = [],
  isLoading,
  now = Date.now(),
}: {
  playing: RetroAchievementsGameCompleted[]
  steamGames?: SteamGameProgress[]
  isLoading?: boolean
  now?: number
}) {
  const { T } = useLanguage()
  // Recently played games already carry a LastPlayed date and are fetched once
  // and shared app-wide — reuse it instead of a per-game RA call for every
  // "playing" game. Only games missing from that list (rare: very old, very
  // inactive games that fell out of RA's most-recently-played window) still
  // need the dedicated /api/getGamesLastPlayed lookup.
  const { games: recentlyPlayed, isLoading: recentlyPlayedLoading } = useRecentlyPlayedGames()
  const [lastAchDates, setLastAchDates] = useState<Record<number, string>>({})
  const [fetchedKey, setFetchedKey] = useState('')
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const lastPlayedMap = useMemo(
    () => new Map(recentlyPlayed.map((g) => [g.GameID, g.LastPlayed])),
    [recentlyPlayed]
  )

  const missingIdsKey = useMemo(
    () => playing.filter((g) => !lastPlayedMap.has(g.GameID)).map((g) => g.GameID).join(','),
    [playing, lastPlayedMap]
  )

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
    if (recentlyPlayedLoading) return
    clearTimeout(retryTimer.current)
    attemptRef.current = 0
    if (!missingIdsKey) {
      setLastAchDates({})
      setFetchedKey('')
      return
    }
    setFetchedKey('')
    doFetch(missingIdsKey)
  }, [missingIdsKey, recentlyPlayedLoading, doFetch])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const abandoned = useMemo(() => {
    const ra: Row[] = playing.flatMap((g) => {
      const dateStr = lastPlayedMap.get(g.GameID) ?? lastAchDates[g.GameID]
      if (!dateStr) return []
      const daysAgo = Math.floor((now - new Date(dateStr.replace(' ', 'T')).getTime()) / DAY_MS)
      return [{
        key: `ra:${g.GameID}`,
        href: `/gameInfo/${g.GameID}`,
        imageUrl: g.ImageIcon ? `https://retroachievements.org${g.ImageIcon}` : undefined,
        title: g.Title,
        subtitle: g.ConsoleName,
        daysAgo,
        pct: Math.round(parseFloat(g.PctWon) * 100),
      }]
    })
    const steam: Row[] = steamGames
      .filter((g) => classifySteamGame(g) === 'playing' && g.lastPlayed)
      .map((g) => ({
        key: `steam:${g.id}`,
        href: `/steamGame/${g.id}`,
        imageUrl: g.imageIcon || undefined,
        title: g.title,
        subtitle: g.consoleName,
        daysAgo: Math.floor((now - new Date(g.lastPlayed!).getTime()) / DAY_MS),
        pct: Math.round(g.pctWon),
      }))
    return [...ra, ...steam].filter((g) => g.daysAgo >= ABANDONED_DAYS).sort((a, b) => b.daysAgo - a.daysAgo)
  }, [playing, steamGames, lastPlayedMap, lastAchDates, now])

  const datesNotReady = recentlyPlayedLoading || (missingIdsKey !== '' && fetchedKey !== missingIdsKey)
  const loading = isLoading || datesNotReady

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">
        {T.cards.abandoned} — {ABANDONED_DAYS}{T.cards.abandonedIdle}
      </p>

      {loading ? (
        <SkeletonGameList count={3} />
      ) : abandoned.length === 0 ? (
        <EmptyState
          icon={<IconMoodEmpty className="w-6 h-6" />}
          title={T.cards.noAbandonedGames}
          subtitle={T.cards.noAbandonedGamesSub}
          size="compact"
          className="py-2"
        />
      ) : (
        <div className="flex flex-col gap-2">
          {abandoned.slice(0, 6).map((g) => (
            <GameListRow
              key={g.key}
              href={g.href}
              imageUrl={g.imageUrl}
              imageAlt={g.title}
              title={g.title}
              subtitle={g.subtitle}
              stat={`${g.daysAgo}d`}
              statLabel={`${g.pct}%`}
              statClassName="text-orange-400"
            />
          ))}
        </div>
      )}
    </div>
  )
}
