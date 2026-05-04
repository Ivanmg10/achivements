'use client'

import { useParams } from 'next/navigation'
import { useState, useMemo } from 'react'
import { useGamesByCategory } from '../../../hooks/useGamesByCategory'
import { useGameExtraData } from '../../../hooks/useGameExtraData'
import { RetroAchievementsGameCompleted } from '@/types/types'
import StatusGameList from '../../../components/statusGameList/StatusGameList'
import StatusPageHeader from '../../../components/status-page-header/StatusPageHeader'
import CompletedFilter, { CompletedMode } from '../../../components/completed-filter/CompletedFilter'
import Spinner from '../../../components/main-spinner/Spinner'
import EmptyState from '../../../components/empty-state/EmptyState'
import { useLanguage } from '@/context/LanguageContext'

export default function CategoryPage() {
  const { category } = useParams()
  const { games, loading, error } = useGamesByCategory(category as string)
  const extraData = useGameExtraData()
  const { T } = useLanguage()
  const [completedMode, setCompletedMode] = useState<CompletedMode>('all')

  const EMPTY_STATE: Record<string, { icon: string; title: string; sub: string }> = {
    wantToPlay: { icon: '🔖', title: T.categoryPage.noWantToPlay,  sub: T.categoryPage.noWantToPlaySub },
    playing:    { icon: '🎮', title: T.categoryPage.noPlaying,     sub: T.categoryPage.noPlayingSub },
    completed:  { icon: '🏆', title: T.categoryPage.noCompleted,   sub: T.categoryPage.noCompletedSub },
  }

  const cat = category as string

  const visibleGames = useMemo(() => {
    let list = games
    if (cat === 'completed' && completedMode !== 'all') {
      list = list.filter((g) => {
        const hc = Number((g as RetroAchievementsGameCompleted).HardcoreMode)
        return completedMode === 'hardcore' ? hc === 1 : hc === 0
      })
    }
    if (cat === 'playing' || cat === 'completed') {
      list = [...list].sort((a, b) => {
        const aId = a.GameID ?? (a.ID as number)
        const bId = b.GameID ?? (b.ID as number)
        const aExtra = extraData.get(aId)
        const bExtra = extraData.get(bId)
        const aDate = cat === 'playing'
          ? aExtra?.lastPlayed
          : aExtra?.awards?.[0]?.AwardedAt
        const bDate = cat === 'playing'
          ? bExtra?.lastPlayed
          : bExtra?.awards?.[0]?.AwardedAt
        if (!aDate && !bDate) return 0
        if (!aDate) return 1
        if (!bDate) return -1
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
    }
    return list
  }, [games, cat, completedMode, extraData])

  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-white">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-1 items-center justify-center min-h-[60vh]">
            <Spinner size={45} />
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm text-center mt-10">{error}</p>
        ) : games.length === 0 ? (
          <EmptyState
            icon={EMPTY_STATE[cat]?.icon ?? '🎮'}
            title={EMPTY_STATE[cat]?.title ?? ''}
            subtitle={EMPTY_STATE[cat]?.sub ?? ''}
            className="min-h-[60vh]"
          />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <StatusPageHeader category={cat} gameCount={visibleGames.length} />
              {cat === 'completed' && (
                <CompletedFilter value={completedMode} onChange={setCompletedMode} />
              )}
            </div>
            <StatusGameList games={visibleGames} extraData={extraData} category={cat} />
          </>
        )}
      </div>
    </div>
  )
}
