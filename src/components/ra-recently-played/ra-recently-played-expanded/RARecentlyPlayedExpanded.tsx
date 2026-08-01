'use client'

import { RecentlyPlayedGame, RetroAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { AchievementGrid } from '@/components/achievement-grid/AchievementGrid'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { GameAchievementsProgressChart } from '@/components/game-achievements-progress-chart/GameAchievementsProgressChart'
import { GamePinnedAchievements } from '@/components/game-pinned-achievements/GamePinnedAchievements'
import { GameExpandedMobileStats } from './game-expanded-mobile-stats/GameExpandedMobileStats'

export function RARecentlyPlayedExpanded({
  game,
  achievements,
  numDistinctPlayers,
  isLoading,
}: {
  game: Pick<RecentlyPlayedGame, 'GameID' | 'Title' | 'NumAchieved' | 'NumPossibleAchievements'>
  achievements: RetroAchievement[]
  numDistinctPlayers: number
  isLoading: boolean
}) {
  const { T } = useLanguage()
  const totalPoints = achievements.reduce((sum, a) => sum + a.Points, 0)
  const earnedPoints = achievements
    .filter((a) => a.DateEarned || a.DateEarnedHardcore)
    .reduce((sum, a) => sum + a.Points, 0)
  const hardcorePoints = achievements
    .filter((a) => a.DateEarnedHardcore)
    .reduce((sum, a) => sum + a.Points, 0)
  const remaining = game.NumPossibleAchievements - game.NumAchieved
  const completionPct =
    game.NumPossibleAchievements > 0
      ? Math.round((game.NumAchieved / game.NumPossibleAchievements) * 100)
      : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[190px_1.3fr_1fr] lg:grid-rows-[20rem_auto] gap-3 w-full">
      <div className="bg-bg-header/40 rounded-xl p-4 lg:p-6 flex flex-row items-center gap-4 lg:flex-col lg:justify-center lg:h-full lg:col-start-1 lg:row-start-1">
        <CircularProgress
          earned={game.NumAchieved}
          total={game.NumPossibleAchievements}
          label={T.gameExpanded.allAchievements}
          size={130}
        />
        <GameExpandedMobileStats
          points={earnedPoints}
          totalPoints={totalPoints}
          hardcorePoints={hardcorePoints}
          completionPct={completionPct}
          remaining={remaining}
        />
      </div>
      <div className="bg-bg-header/40 rounded-xl p-3 lg:col-start-1 lg:col-span-2 lg:row-start-2">
        <p className="text-xs text-text-secondary mb-2">{T.gameExpanded.allAchievements}</p>
        <AchievementGrid
          achievements={isLoading ? [] : achievements}
          total={game.NumPossibleAchievements}
          gameId={game.GameID}
          gameTitle={game.Title}
          numDistinctPlayers={numDistinctPlayers}
        />
      </div>
      <div className="bg-bg-header/40 rounded-xl p-3 lg:h-full lg:col-start-2 lg:row-start-1">
        <GameAchievementsProgressChart achievements={achievements} isLoading={isLoading} />
      </div>
      <div className="bg-bg-header/40 rounded-xl p-3 lg:h-full lg:col-start-3 lg:row-start-1 lg:row-span-2">
        <GamePinnedAchievements
          gameId={game.GameID}
          gameTitle={game.Title}
          numDistinctPlayers={numDistinctPlayers}
          achievements={achievements}
        />
      </div>
    </div>
  )
}
