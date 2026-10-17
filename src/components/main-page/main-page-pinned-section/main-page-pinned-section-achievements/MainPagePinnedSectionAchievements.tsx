'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconStar } from '@tabler/icons-react'
import type { PinnedAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { usePinnedAchievements } from '@/hooks/usePinnedAchievements'
import { pinnedView } from '@/utils/pinnedView'
import AchievementModal from '@/components/achievement-modal/AchievementModal'
import EmptyState from '@/components/empty-state/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SectionFallback } from '@/components/ui/SectionFallback'
import MainPagePinnedSectionAchievementTile from '../main-page-pinned-section-achievement-tile/MainPagePinnedSectionAchievementTile'
import MainPagePinnedSectionSortable from '../main-page-pinned-section-sortable/MainPagePinnedSectionSortable'

type RaPin = Extract<PinnedAchievement, { source: 'ra' }>

const GRID = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3'

/**
 * The pinned achievements, the heart of the Pinned section: how many are
 * earned, then each as a tile, in the user's order (drag a tile's grip to
 * change it). RA's open their detail modal, as everywhere.
 */
export default function MainPagePinnedSectionAchievements() {
  const { T } = useLanguage()
  const { pinned, isLoading, error, refetch, unpin, reorder } = usePinnedAchievements()
  const [selected, setSelected] = useState<RaPin | null>(null)
  const views = useMemo(() => pinned.map((fav) => ({ fav, view: pinnedView(fav, T) })), [pinned, T])
  const earned = views.filter(({ view }) => view.earned).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h3 className="text-xl font-bold">{T.favorites.title}</h3>
        {!isLoading && views.length > 0 && (
          <div className="flex items-center gap-3 w-full sm:w-72">
            <ProgressBar pct={(earned / views.length) * 100} label={T.favorites.title} className="flex-1" />
            <span className="text-xs text-text-secondary whitespace-nowrap tabular-nums">
              {T.favorites.progress.replace('{n}', String(earned)).replace('{total}', String(views.length))}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className={GRID} aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-bg-main animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      ) : error ? (
        <SectionFallback error onRefresh={refetch}>{null}</SectionFallback>
      ) : views.length === 0 ? (
        <EmptyState icon={<IconStar className="w-6 h-6" />} title={T.favorites.emptyTitle} subtitle={T.favorites.empty} size="compact" />
      ) : (
        <MainPagePinnedSectionSortable
          items={views}
          idOf={({ view }) => view.key}
          labelOf={({ view }) => view.title}
          onReorder={(next) => reorder(next.map(({ fav }) => fav))}
          className={GRID}
          renderItem={({ fav, view }, handle) => (
            <MainPagePinnedSectionAchievementTile
              view={view}
              onOpen={fav.source === 'ra' ? () => setSelected(fav) : undefined}
              onUnpin={() => unpin(fav)}
              handle={handle}
            />
          )}
        />
      )}

      <AnimatePresence>
        {selected && (
          <AchievementModal
            achievement={selected.snapshot}
            numDistinctPlayers={selected.num_distinct_players}
            onClose={() => setSelected(null)}
            gameId={selected.game_id}
            isFavorited
            onToggleFavorite={() => {
              unpin(selected)
              setSelected(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
