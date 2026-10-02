'use client'

import { useMemo } from 'react'
import type { SteamGameProgress } from '@/types/steam'
import { useLanguage } from '@/context/LanguageContext'
import { classifySteamGame, hasUnloadedProgress, summarizeSteamLibrary } from '@/utils/steamFeed'
import CompletionDistribution from '@/components/completion-distribution/CompletionDistribution'
import ClosestToComplete, { CLOSEST_SHOWN } from '../closest-to-complete/ClosestToComplete'
import SteamMostPlayed from '../steam-most-played/SteamMostPlayed'
import SteamRecentPerfects from '../steam-recent-perfects/SteamRecentPerfects'

/**
 * Steam's side of the mastery card. Steam has no mastery or beaten awards, so
 * it sums up the library instead — perfect and in-progress games, unlocks,
 * average completion, games and playtime. It is laid out like the RA card,
 * part for part: most played where RA has by console, recently perfected
 * where RA has recent masteries, and closest to perfect on both.
 */
export default function MainPageSteamMastery({ games, isLoading }: { games: SteamGameProgress[]; isLoading?: boolean }) {
  const { T } = useLanguage()

  const summary = useMemo(() => {
    const playing = games.filter((g) => classifySteamGame(g) === 'playing')
    return {
      ...summarizeSteamLibrary(games),
      hours: Math.round(games.reduce((sum, g) => sum + g.playtimeForever, 0) / 60),
      closest: [...playing]
        .sort((a, b) => b.pctWon - a.pctWon)
        .slice(0, CLOSEST_SHOWN)
        .map((g) => ({
          key: String(g.id),
          href: `/steamGame/${g.id}`,
          title: g.title,
          imageUrl: g.imageIcon || undefined,
          done: g.numAwarded,
          total: g.maxPossible,
          percent: g.pctWon,
        })),
      // Only games whose counts are really loaded: the rest would read as 0%.
      loadedFractions: games.filter((g) => g.achievementsLoaded && g.maxPossible > 0).map((g) => g.numAwarded / g.maxPossible),
      truncated: hasUnloadedProgress(games),
    }
  }, [games])

  // The headline is perfect games; the rest supports it rather than competing.
  const stats = [
    { value: summary.playing, label: T.categories.playing },
    { value: summary.unlocked.toLocaleString(), label: T.steam.statAchievements },
    { value: `${summary.avgCompletion}%`, label: T.cards.steamAvgCompletion },
    { value: games.length, label: T.steam.statGames },
    { value: `${summary.hours.toLocaleString()}${T.steam.hoursShort}`, label: T.steam.totalPlaytime },
  ]

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.steamProgress}</p>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]" aria-busy="true">
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-10 w-28 rounded bg-white/10" />
            <div className="h-2.5 w-full rounded-full bg-white/10" />
            <div className="h-8 w-full rounded bg-white/10" />
          </div>
          <div className="h-24 rounded bg-white/10 animate-pulse" />
        </div>
      ) : (
        // Two columns from sm up, as on the RA card: the summary beside the most
        // played, then recently perfected beside closest to perfect.
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            {/* The headline: perfect games, against the library that could be perfect. */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-warning tabular-nums leading-none">{summary.perfect}</span>
              <span className="text-xs text-text-secondary">
                {T.steam.statPerfect} · {summary.loadedFractions.length} {T.steam.statGames.toLowerCase()}
              </span>
            </div>

            <CompletionDistribution
              fractions={summary.loadedFractions}
              tone="steam"
              note={summary.truncated ? T.steam.partialProgressNote : undefined}
            />

            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {stats.map(({ value, label }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-sm font-semibold text-text-main tabular-nums">{value}</span>
                  <span className="text-[10px] text-text-secondary">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <SteamMostPlayed games={games} />
          <SteamRecentPerfects games={games} />
          <ClosestToComplete games={summary.closest} statClassName="text-[#66c0f4]" />
        </div>
      )}
    </div>
  )
}
