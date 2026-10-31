'use client'

import { useMemo } from 'react'
import { IconPin } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import { useProfileLibrary } from '@/hooks/useProfileLibrary'
import { gameKey } from '@/utils/gameRef'
import type { LibraryGame } from '@/utils/library'
import { notify } from '@/lib/notify'
import EmptyState from '@/components/empty-state/EmptyState'
import MainPagePinnedSectionGameTile from '../main-page-pinned-section-game-tile/MainPagePinnedSectionGameTile'
import MainPagePinnedSectionSortable from '../main-page-pinned-section-sortable/MainPagePinnedSectionSortable'
import { SkeletonRow } from '@/components/ui/SkeletonList'

const GRID = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2'

/**
 * The pinned games under the pinned achievements, compact, in their saved
 * order — the same one as Recently played's pinned view, which a drag of a
 * tile's grip here changes too. A pin whose game no library lists is left out
 * of the grid, and kept after the others when the order is saved.
 */
export default function MainPagePinnedSectionGames() {
  const { T } = useLanguage()
  const { pins, isLoading: pinsLoading, reorder } = usePinnedGames()
  const { games, isLoading: libraryLoading } = useProfileLibrary()
  const pinned = useMemo(() => {
    const byKey = new Map(games.map((g) => [g.key, g]))
    return pins.flatMap((p) => byKey.get(gameKey(p.source, p.id)) ?? [])
  }, [pins, games])
  const isLoading = pinsLoading || libraryLoading

  async function saveOrder(next: LibraryGame[]) {
    const shown = new Set(next.map((g) => g.key))
    try {
      await reorder([...next.map((g) => ({ source: g.source, id: g.id })), ...pins.filter((p) => !shown.has(gameKey(p.source, p.id)))])
    } catch (err) {
      console.error('[MainPagePinnedSectionGames] reorder', err)
      notify.error(T.toast.orderFailed)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.pinnedGames.title}</p>
        {!isLoading && pinned.length > 0 && <span className="text-[10px] text-text-secondary tabular-nums">{pinned.length}</span>}
      </div>
      {isLoading ? (
        <div className={GRID} aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonRow key={i} icon="w-11 h-11" className="h-15 bg-bg-main rounded-tile px-2 gap-2.5" />
          ))}
        </div>
      ) : pinned.length === 0 ? (
        <EmptyState icon={<IconPin className="w-6 h-6" />} title={T.pinnedGames.emptyTitle} subtitle={T.pinnedGames.empty} size="compact" />
      ) : (
        <MainPagePinnedSectionSortable
          items={pinned}
          idOf={(g) => g.key}
          labelOf={(g) => g.title}
          onReorder={saveOrder}
          className={GRID}
          renderItem={(g, handle) => <MainPagePinnedSectionGameTile game={g} handle={handle} />}
        />
      )}
    </div>
  )
}
