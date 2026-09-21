'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { GameAchievementsProgressChart } from '@/components/game-achievements-progress-chart/GameAchievementsProgressChart'
import { SteamAchievementGrid } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import SteamExpandedStats from './steam-expanded-stats/SteamExpandedStats'
import SteamRarestAchievements from './steam-rarest-achievements/SteamRarestAchievements'
import type { SteamGameProgress } from '@/types/steam'

const SKELETON_BADGES = 24

/**
 * An expanded Steam game in the recent feed, laid out exactly like RA's
 * RARecentlyPlayedExpanded: progress ring (+ stats on small screens), the
 * achievements-over-time chart, the full badge grid, and a side panel —
 * the player's rarest unlocks where RA shows pinned achievements.
 *
 * Achievements load when this mounts, i.e. when the card is opened. Until
 * then the ring uses the counts the feed already has.
 */
export default function SteamRecentlyPlayedExpanded({ game }: { game: SteamGameProgress }) {
  const { T } = useLanguage()
  const { achievements, isLoading, error, retry } = useSteamAchievements(game.id)

  const loaded = achievements.length > 0
  const total = loaded ? achievements.length : game.maxPossible
  const earned = loaded ? achievements.filter((a) => a.earned).length : game.numAwarded
  const completionPct = total > 0 ? Math.round((earned / total) * 100) : 0

  // The chart only reads unlock dates; Steam has no hardcore date.
  const unlocks = achievements.map((a) => ({ DateEarned: a.dateEarned, DateEarnedHardcore: null }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[190px_1.3fr_1fr] lg:grid-rows-[20rem_auto] gap-3 w-full">
      <div className="bg-bg-header/40 rounded-xl p-4 lg:p-6 flex flex-row items-center gap-4 lg:flex-col lg:justify-center lg:h-full lg:col-start-1 lg:row-start-1">
        <CircularProgress earned={earned} total={total} label={T.gameExpanded.allAchievements} size={130} />
        <SteamExpandedStats
          playtimeForever={game.playtimeForever}
          playtime2Weeks={game.playtime2Weeks}
          completionPct={completionPct}
          remaining={Math.max(0, total - earned)}
        />
      </div>

      <div className="bg-bg-header/40 rounded-xl p-3 lg:col-start-1 lg:col-span-2 lg:row-start-2">
        <p className="text-xs text-text-secondary mb-2">{T.gameExpanded.allAchievements}</p>
        {isLoading ? (
          <ul aria-busy="true" className="flex flex-wrap gap-1">
            {Array.from({ length: Math.min(total || SKELETON_BADGES, 60) }).map((_, i) => (
              <li key={i} className="w-10 h-10 rounded-lg bg-white/10 animate-pulse" />
            ))}
          </ul>
        ) : error ? (
          <div className="flex flex-col items-start gap-2">
            <p role="alert" className="text-sm text-red-400">
              {T.steam.achievementsError}
            </p>
            <p className="text-xs text-text-secondary">{T.steam.privateProfileHint}</p>
            <button
              onClick={retry}
              className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
            >
              {T.steam.retry}
            </button>
          </div>
        ) : loaded ? (
          <SteamAchievementGrid appId={game.id} achievements={achievements} badgeSize={40} />
        ) : (
          <p className="text-sm text-text-secondary">{T.steam.noAchievements}</p>
        )}
      </div>

      <div className="bg-bg-header/40 rounded-xl p-3 lg:h-full lg:col-start-2 lg:row-start-1">
        <GameAchievementsProgressChart achievements={unlocks} isLoading={isLoading} />
      </div>

      <div className="bg-bg-header/40 rounded-xl p-3 lg:h-full lg:col-start-3 lg:row-start-1 lg:row-span-2">
        <SteamRarestAchievements appId={game.id} achievements={achievements} isLoading={isLoading} />
      </div>
    </div>
  )
}
