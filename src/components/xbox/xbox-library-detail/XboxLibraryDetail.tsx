'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { XboxAchievementGrid } from '@/components/xbox/xbox-achievement-grid/XboxAchievementGrid'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import LibraryGameDetail, { type LibraryCategory } from '@/components/library-game-detail/LibraryGameDetail'
import { fromXbox } from '@/utils/gameInsights'
import type { XboxGameProgress } from '@/types/xbox'

const asCategory = (c?: string): LibraryCategory => (c === 'wantToPlay' || c === 'completed' ? c : 'playing')

/**
 * An opened Xbox card in a status list: PsnLibraryDetail's counterpart.
 * Achievements load when this mounts, i.e. when the card is opened; until then
 * the ring uses the counts the list already has.
 */
export default function XboxLibraryDetail({ game, category }: { game: XboxGameProgress; category?: string }) {
  const { T } = useLanguage()
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
      state={isLoading ? 'loading' : error ? 'error' : 'ready'}
      errorNode={
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-red-400">{T.xbox.achievementsError}</p>
          {error === 'private' && <p className="text-xs text-text-secondary">{T.xbox.errors.private}</p>}
          <button onClick={retry} className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
            {T.xbox.retry}
          </button>
        </div>
      }
      ring={{ earned, total, label: T.xbox.achievements }}
      ringExtra={<XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} />}
      facts={[]}
      empty={T.xbox.noAchievements}
      grid={<XboxAchievementGrid gameId={game.id} gameTitle={game.title} achievements={achievements} badgeSize={48} limit={60} />}
    />
  )
}
