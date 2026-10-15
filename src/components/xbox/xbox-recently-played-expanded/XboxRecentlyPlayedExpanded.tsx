'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { GameAchievementsProgressChart } from '@/components/game-achievements-progress-chart/GameAchievementsProgressChart'
import { XboxAchievementGrid } from '@/components/xbox/xbox-achievement-grid/XboxAchievementGrid'
import XboxRarestAchievements from '@/components/xbox/xbox-rarest-achievements/XboxRarestAchievements'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import XboxPartialListNote from '@/components/xbox/xbox-partial-list-note/XboxPartialListNote'
import type { XboxGameProgress } from '@/types/xbox'

const SKELETON_BADGES = 24

/**
 * An expanded Xbox game in the recent feed and the pinned list, laid out like
 * PSN's: progress ring (with the gamerscore), the achievements-over-time chart
 * and the rarest earned on top, the full badge grid across the card below.
 * Achievements load when this mounts, i.e. when the card is opened; until then
 * the ring uses the counts the list already has.
 */
export default function XboxRecentlyPlayedExpanded({ game }: { game: XboxGameProgress }) {
  const { T } = useLanguage()
  const { achievements, isLoading, error, retry } = useXboxAchievements(game.titleId)

  const loaded = achievements.length > 0
  // The list can lack a total, and Xbox 360 lists only what was unlocked: the game's own total wins.
  const total = loaded && !game.totalKnown ? achievements.length : Math.max(game.maxPossible, achievements.length)
  const earned = loaded ? achievements.filter((a) => a.unlocked).length : game.numAwarded

  // The chart only reads earn dates; Xbox has no hardcore.
  const unlocks = achievements.map((a) => ({ DateEarned: a.unlockedAt, DateEarnedHardcore: null }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[190px_1.3fr_1fr] lg:grid-rows-[20rem_auto] gap-3 w-full">
      <div className="bg-bg-header/40 rounded-xl p-4 lg:p-6 flex flex-row items-center gap-4 lg:flex-col lg:justify-center lg:h-full lg:col-start-1 lg:row-start-1">
        <CircularProgress earned={earned} total={total} label={T.xbox.achievements} size={130} />
        <XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} className="text-sm" />
      </div>

      <div className="bg-bg-header/40 rounded-xl p-3 lg:col-start-1 lg:col-span-3 lg:row-start-2">
        <p className="text-xs text-text-secondary mb-2">{T.xbox.achievements}</p>
        {isLoading ? (
          <ul aria-busy="true" className="flex flex-wrap gap-1">
            {Array.from({ length: Math.min(total || SKELETON_BADGES, 60) }).map((_, i) => (
              <li key={i} className="w-10 h-10 rounded-lg bg-ink/10 animate-pulse" />
            ))}
          </ul>
        ) : error ? (
          <div className="flex flex-col items-start gap-2">
            <p role="alert" className="text-sm text-red-400">
              {T.xbox.achievementsError}
            </p>
            {error === 'private' && <p className="text-xs text-text-secondary">{T.xbox.errors.private}</p>}
            <button onClick={retry} className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
              {T.xbox.retry}
            </button>
          </div>
        ) : loaded ? (
          <>
            <XboxAchievementGrid gameId={game.id} gameTitle={game.title} achievements={achievements} badgeSize={40} />
            <XboxPartialListNote game={game} listed={achievements.length} />
          </>
        ) : (
          <p className="text-sm text-text-secondary">{T.xbox.noAchievements}</p>
        )}
      </div>

      <div className="bg-bg-header/40 rounded-xl p-3 lg:h-full lg:col-start-2 lg:row-start-1">
        <GameAchievementsProgressChart achievements={unlocks} isLoading={isLoading} />
      </div>

      <div className="bg-bg-header/40 rounded-xl p-3 lg:h-full lg:col-start-3 lg:row-start-1">
        <XboxRarestAchievements gameId={game.id} achievements={achievements} isLoading={isLoading} />
      </div>
    </div>
  )
}
