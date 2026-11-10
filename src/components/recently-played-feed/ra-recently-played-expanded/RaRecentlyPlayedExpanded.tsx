'use client'

import { RecentlyPlayedGame, RetroAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { AchievementGrid } from '@/components/achievement-grid/AchievementGrid'
import { fromRa } from '@/utils/gameInsights'
import GameExpandedLayout from '@/components/game-expanded-layout/GameExpandedLayout'
import { GamePinnedAchievements } from '@/components/game-pinned-achievements/GamePinnedAchievements'
import { GameExpandedMobileStats } from './game-expanded-mobile-stats/GameExpandedMobileStats'

/**
 * An opened RA game in the recent feed: the ring with its points on small screens, the chart and the
 * pinned achievements, the full grid below, which holds its own skeleton until the pictures are in.
 */
export default function RaRecentlyPlayedExpanded({
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
    <GameExpandedLayout
      earned={game.NumAchieved}
      total={game.NumPossibleAchievements}
      ringLabel={T.gameExpanded.allAchievements}
      ringExtra={
        <GameExpandedMobileStats
          points={earnedPoints}
          totalPoints={totalPoints}
          hardcorePoints={hardcorePoints}
          completionPct={completionPct}
          remaining={remaining}
        />
      }
      gridTitle={T.gameExpanded.allAchievements}
      unlocks={fromRa(achievements, numDistinctPlayers, game.GameID)}
      isLoading={isLoading}
      side={
        <GamePinnedAchievements
          gameId={game.GameID}
          gameTitle={game.Title}
          numDistinctPlayers={numDistinctPlayers}
          achievements={achievements}
        />
      }
    >
      <AchievementGrid
        achievements={isLoading ? [] : achievements}
        total={game.NumPossibleAchievements}
        gameId={game.GameID}
        gameTitle={game.Title}
        numDistinctPlayers={numDistinctPlayers}
      />
    </GameExpandedLayout>
  )
}
