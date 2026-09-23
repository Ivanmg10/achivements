'use client'

import { useMemo } from 'react'
import type { SteamGameProgress } from '@/types/steam'
import { useLanguage } from '@/context/LanguageContext'
import { classifySteamGame, hasUnloadedProgress } from '@/utils/steamFeed'
import { GameListRow } from '@/components/ui/GameListRow'
import CompletionDistribution from '@/components/completion-distribution/CompletionDistribution'

const CLOSEST = 3

/**
 * Steam's side of the mastery card. Steam has no mastery or beaten awards, so
 * it sums up the library instead — perfect and in-progress games, unlocks,
 * average completion, games and playtime — and lists the started games
 * closest to perfect, where RA shows recent masteries.
 */
export default function MainPageSteamMastery({ games, isLoading }: { games: SteamGameProgress[]; isLoading?: boolean }) {
  const { T } = useLanguage()

  const summary = useMemo(() => {
    const playing = games.filter((g) => classifySteamGame(g) === 'playing')
    const perfect = games.filter((g) => classifySteamGame(g) === 'completed')
    const started = [...playing, ...perfect]
    return {
      perfect: perfect.length,
      playing: playing.length,
      unlocked: games.reduce((sum, g) => sum + (g.achievementsLoaded ? g.numAwarded : 0), 0),
      avgCompletion: started.length ? Math.round(started.reduce((sum, g) => sum + g.pctWon, 0) / started.length) : 0,
      hours: Math.round(games.reduce((sum, g) => sum + g.playtimeForever, 0) / 60),
      closest: [...playing].sort((a, b) => b.pctWon - a.pctWon).slice(0, CLOSEST),
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
        // Wide card: the summary sits beside the games closest to perfect, and
        // spreads across the full width when there are none to show.
        <div className={`grid gap-4 ${summary.closest.length > 0 ? 'lg:grid-cols-[3fr_2fr]' : ''}`}>
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

          {summary.closest.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] text-text-secondary/60 uppercase tracking-widest">{T.cards.closestToPerfect}</p>
              {summary.closest.map((g) => (
                <GameListRow
                  key={g.id}
                  href={`/steamGame/${g.id}`}
                  imageUrl={g.imageIcon || undefined}
                  imageAlt={g.title}
                  title={g.title}
                  subtitle={`${g.numAwarded}/${g.maxPossible}`}
                  stat={`${Math.round(g.pctWon)}%`}
                  statClassName="text-[#66c0f4]"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
