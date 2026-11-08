'use client'

import { useMemo, useState } from 'react'
import { IconMoodEmpty } from '@tabler/icons-react'
import { RetroAchievementsGameCompleted } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import type { PsnGameProgress } from '@/types/psn'
import type { XboxGameProgress } from '@/types/xbox'
import { useLanguage } from '@/context/LanguageContext'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { classifySteamGame } from '@/utils/steamFeed'
import { classifyPsnGame } from '@/utils/psnTitles'
import { classifyXboxGame } from '@/utils/xboxTitles'
import { gameHref } from '@/utils/gameRef'
import { GameListRow } from '@/components/ui/GameListRow'
import { SkeletonGameList } from '@/components/ui/SkeletonList'
import EmptyState from '@/components/empty-state/EmptyState'
import { useRetryingRead } from '@/hooks/useRetryingRead'
import { useSubject } from '@/context/SubjectContext'
import { parseUnlockTime } from '@/utils/dates'
import { raImageUrl } from '@/utils/raAssets'

const ABANDONED_DAYS = 30
const DAY_MS = 1000 * 60 * 60 * 24
const NO_DATES: Record<number, string> = {}
const asDates = (data: unknown) => (data && typeof data === 'object' ? (data as Record<number, string>) : null)

type Row = { key: string; href: string; imageUrl?: string; title: string; subtitle: string; daysAgo: number; pct: number }

/**
 * Games in progress on any platform, untouched for 30+ days, longest idle
 * first. Steam and PSN games come from their libraries, which already carry
 * the last-played date and counts, so they need none of RA's extra lookups.
 * (For PSN, "last played" is the last trophy — the closest Sony says.)
 */

export default function MainPageAbandoned({
  playing,
  steamGames = [],
  psnGames = [],
  xboxGames = [],
  isLoading,
  now: nowProp,
}: {
  playing: RetroAchievementsGameCompleted[]
  steamGames?: SteamGameProgress[]
  psnGames?: PsnGameProgress[]
  xboxGames?: XboxGameProgress[]
  isLoading?: boolean
  now?: number
}) {
  const { T } = useLanguage()
  const subject = useSubject()
  // Read once, when the page opens: render has to give the same answer every time.
  const [mountedAt] = useState(Date.now)
  const now = nowProp ?? mountedAt
  // Recently played games already carry a LastPlayed date and are fetched once
  // and shared app-wide — reuse it instead of a per-game RA call for every
  // "playing" game. Only games missing from that list (rare: very old, very
  // inactive games that fell out of RA's most-recently-played window) still
  // need the dedicated /api/getGamesLastPlayed lookup.
  const { games: recentlyPlayed, isLoading: recentlyPlayedLoading } = useRecentlyPlayedGames()

  const lastPlayedMap = useMemo(
    () => new Map(recentlyPlayed.map((g) => [g.GameID, g.LastPlayed])),
    [recentlyPlayed]
  )

  const missingIdsKey = useMemo(
    // The endpoint answers for at most 100 games at a time; past that, the rest go without a date.
    () => playing.filter((g) => !lastPlayedMap.has(g.GameID)).slice(0, 100).map((g) => g.GameID).join(','),
    [playing, lastPlayedMap]
  )

  // Giving up just leaves out the RA games with no known date; the rest still show.
  const dates = useRetryingRead(recentlyPlayedLoading || !missingIdsKey ? null : `/api/getGamesLastPlayed?gameIds=${missingIdsKey}`, { parse: asDates })
  const lastAchDates = dates.data ?? NO_DATES

  const abandoned = useMemo(() => {
    const ra: Row[] = playing.flatMap((g) => {
      const dateStr = lastPlayedMap.get(g.GameID) ?? lastAchDates[g.GameID]
      if (!dateStr) return []
      const daysAgo = Math.floor((now - parseUnlockTime(dateStr)) / DAY_MS)
      return [{
        key: `ra:${g.GameID}`,
        href: gameHref('ra', g.GameID, subject),
        imageUrl: raImageUrl(g.ImageIcon),
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
        href: gameHref('steam', g.id, subject),
        imageUrl: g.imageIcon || undefined,
        title: g.title,
        subtitle: g.consoleName,
        daysAgo: Math.floor((now - new Date(g.lastPlayed!).getTime()) / DAY_MS),
        pct: Math.round(g.pctWon),
      }))
    const psn: Row[] = psnGames
      .filter((g) => classifyPsnGame(g) === 'playing' && g.lastPlayed)
      .map((g) => ({
        key: `psn:${g.id}`,
        href: gameHref('psn', g.id, subject),
        imageUrl: g.imageIcon || undefined,
        title: g.title,
        subtitle: g.consoleName,
        daysAgo: Math.floor((now - new Date(g.lastPlayed!).getTime()) / DAY_MS),
        pct: Math.round(g.pctWon),
      }))
    const xbox: Row[] = xboxGames
      .filter((g) => classifyXboxGame(g) === 'playing' && g.lastPlayed)
      .map((g) => ({
        key: `xbox:${g.id}`,
        href: gameHref('xbox', g.id, subject),
        imageUrl: g.imageIcon || undefined,
        title: g.title,
        subtitle: g.consoleName,
        daysAgo: Math.floor((now - new Date(g.lastPlayed!).getTime()) / DAY_MS),
        pct: Math.round(g.pctWon),
      }))
    return [...ra, ...steam, ...psn, ...xbox].filter((g) => g.daysAgo >= ABANDONED_DAYS).sort((a, b) => b.daysAgo - a.daysAgo)
  }, [playing, steamGames, psnGames, xboxGames, lastPlayedMap, lastAchDates, now, subject])

  const datesNotReady = recentlyPlayedLoading || dates.isLoading
  const loading = isLoading || datesNotReady

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">
        {T.cards.abandoned} — {ABANDONED_DAYS}{T.cards.abandonedIdle}
      </p>

      {loading ? (
        <SkeletonGameList count={7} />
      ) : abandoned.length === 0 ? (
        <EmptyState
          icon={<IconMoodEmpty className="w-6 h-6" />}
          title={T.cards.noAbandonedGames}
          subtitle={T.cards.noAbandonedGamesSub}
          size="compact"
          className="py-2"
        />
      ) : (
        <div className="flex flex-col gap-2 enter-rows">
          {abandoned.slice(0, 6).map((g) => (
            <GameListRow
              key={g.key}
              href={g.href}
              imageUrl={g.imageUrl}
              title={g.title}
              subtitle={g.subtitle}
              stat={`${g.daysAgo}d`}
              statLabel={`${g.pct}%`}
              statClassName="text-warning"
              progress={g.pct}
            />
          ))}
        </div>
      )}
    </div>
  )
}
