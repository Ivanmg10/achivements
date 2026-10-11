'use client'

import { useMemo } from 'react'
import type { RetroAchievement, RetroAchievementsGameWithAchievements } from '@/types/types'
import type { CategoryGame } from '@/hooks/useGamesByCategory'
import { useLanguage } from '@/context/LanguageContext'
import { AchievementGrid } from '@/components/achievement-grid/AchievementGrid'
import { SectionFallback } from '@/components/ui/SectionFallback'
import LibraryGameDetail, { type LibraryCategory } from '@/components/library-game-detail/LibraryGameDetail'
import { fromRa } from '@/utils/gameInsights'

// About three rows at two columns on a wide screen; the rest is a click away.
const ACHIEVEMENT_LIMIT = 60

const asCategory = (c?: string): LibraryCategory => (c === 'wantToPlay' || c === 'completed' ? c : 'playing')

/**
 * An opened RA card in a status list. The card asks for the game and hands
 * what came back; this turns it into the shared detail layout.
 */
export default function RaLibraryDetail({
  game,
  gameId,
  category,
  data,
  loading,
  error,
  onRetry,
}: {
  game: CategoryGame
  gameId: number | string
  category?: string
  data: RetroAchievementsGameWithAchievements | null
  loading: boolean
  error?: boolean
  onRetry: () => void
}) {
  const { T, lang } = useLanguage()

  const achievements = useMemo(
    () =>
      data
        ? Object.values(data.Achievements ?? {})
            .filter((a): a is RetroAchievement => !!a)
            .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
        : [],
    [data],
  )
  const items = useMemo(() => fromRa(achievements, data?.NumDistinctPlayers ?? 0, gameId), [achievements, data, gameId])

  // Before the answer, the ring goes by what the list already knows.
  const known = 'AchievementsPublished' in game
    ? { earned: 0, total: game.AchievementsPublished ?? 0 }
    : { earned: game.NumAwarded, total: game.MaxPossible }
  const total = items.length > 0 ? items.length : known.total
  const earned = items.length > 0 ? items.filter((a) => a.earned).length : known.earned

  return (
    <LibraryGameDetail
      category={asCategory(category)}
      items={items}
      state={loading ? 'loading' : error && !data ? 'error' : 'ready'}
      errorNode={<SectionFallback error onRefresh={onRetry}>{null}</SectionFallback>}
      ring={{ earned, total, label: T.gameExpanded.allAchievements }}
      facts={data ? [{ label: T.libraryDetail.players, value: (data.NumDistinctPlayers ?? 0).toLocaleString(lang) }] : []}
      empty={T.statusGameItem.noPublishedAchievements}
      grid={
        <AchievementGrid
          achievements={achievements}
          total={total}
          numDistinctPlayers={data?.NumDistinctPlayers ?? 1}
          gameId={gameId}
          gameTitle={game.Title}
          badgeSize={48}
          limit={ACHIEVEMENT_LIMIT}
        />
      }
    />
  )
}
