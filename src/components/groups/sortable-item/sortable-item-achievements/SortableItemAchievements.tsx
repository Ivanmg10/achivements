'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useGameProgression } from '@/hooks/useGameProgression'
import { raAchievementList } from '@/utils/gameAchievements'
import { AchievementGrid } from '@/components/achievement-grid/AchievementGrid'
import { SectionFallback } from '@/components/ui/SectionFallback'
import { Skeleton } from '@/components/ui/Skeleton'

// About three rows on a wide card; the rest is a click away.
const ACHIEVEMENT_LIMIT = 60

/** An RA game's achievements inside its group card. Asked for on first open; the hook keeps the result when the card closes. */
export default function SortableItemAchievements({
  gameId,
  title,
  total,
  open,
}: {
  gameId: number
  title: string
  total: number
  open: boolean
}) {
  const { T } = useLanguage()
  const { game, isLoading, error, refetch } = useGameProgression(open ? String(gameId) : null)
  const loading = isLoading || (open && !game && !error)

  if (loading) {
    return (
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: Math.min(total || 12, 60) }).map((_, i) => (
          <Skeleton key={i} radius="tile" className="w-12 h-12" />
        ))}
      </div>
    )
  }
  if (error && !game) return <SectionFallback error onRefresh={refetch}>{null}</SectionFallback>

  const achievements = game ? raAchievementList(game).sort((a, b) => a.DisplayOrder - b.DisplayOrder) : []
  if (achievements.length === 0) {
    return open ? <p className="text-center text-text-secondary text-sm py-2">{T.statusGameItem.noPublishedAchievements}</p> : null
  }
  return (
    <AchievementGrid
      achievements={achievements}
      total={total}
      numDistinctPlayers={game?.NumDistinctPlayers ?? 1}
      gameId={gameId}
      gameTitle={title}
      badgeSize={48}
      limit={ACHIEVEMENT_LIMIT}
    />
  )
}
