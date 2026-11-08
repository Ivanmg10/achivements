'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { XboxAchievementGrid } from '@/components/xbox/xbox-achievement-grid/XboxAchievementGrid'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import LibraryGameDetail from '@/components/library-game-detail/LibraryGameDetail'
import { fromXbox } from '@/utils/gameInsights'
import { formatPlaytime } from '@/utils/steamFeed'
import type { XboxGameProgress } from '@/types/xbox'
import { latestFullSetCompletedAt } from '@/utils/completionDates'
import type { GameStatus } from '@/types/game'
import ErrorRetry from '@/components/ui/ErrorRetry'

const asCategory = (c?: string): GameStatus => (c === 'wantToPlay' || c === 'completed' ? c : 'playing')

/**
 * An opened Xbox card in a status list: PsnLibraryDetail's counterpart.
 * Achievements load when this mounts, i.e. when the card is opened; until then
 * the ring uses the counts the list already has.
 */
export default function XboxLibraryDetail({ game, category }: { game: XboxGameProgress; category?: string }) {
  const { T, lang } = useLanguage()
  const { achievements, isLoading, error, retry } = useXboxAchievements(game.titleId)
  const items = useMemo(() => fromXbox(achievements, game.id), [achievements, game.id])

  const loaded = achievements.length > 0
  // The list can lack a total (newer games); the loaded game never does.
  const total = loaded ? achievements.length : game.maxPossible
  const earned = loaded ? achievements.filter((a) => a.unlocked).length : game.numAwarded

  return (
    <LibraryGameDetail
      category={asCategory(category)}
      game={{ source: 'xbox', id: game.id, title: game.title, iconUrl: game.imageIcon || undefined }}
      info={game.consoleName ? [{ label: T.libraryDetail.console, value: game.consoleName }] : []}
      items={items}
      completedAt={latestFullSetCompletedAt(items)}
      state={isLoading ? 'loading' : error ? 'error' : 'ready'}
      errorNode={
        <ErrorRetry message={T.xbox.achievementsError} hint={error === 'private' ? T.xbox.errors.private : undefined} retryLabel={T.xbox.retry} onRetry={retry} />
      }
      ring={{ earned, total, label: T.xbox.achievements }}
      ringExtra={<XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} />}
      facts={game.playtimeMinutes ? [{ label: T.steam.playtime, value: formatPlaytime(game.playtimeMinutes, T.steam, lang), className: 'text-xbox' }] : []}
      empty={T.xbox.noAchievements}
      grid={<XboxAchievementGrid gameId={game.id} gameTitle={game.title} achievements={achievements} badgeSize={48} limit={60} />}
    />
  )
}
