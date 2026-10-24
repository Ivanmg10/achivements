'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { useGroupPage } from '@/hooks/useGroupPage'
import { useGroupFilters } from '@/hooks/useGroupFilters'
import { useStoredChoice } from '@/hooks/useStoredChoice'
import { useGroupProgress } from '@/hooks/useGroupProgress'
import { filterGroupItems, itemKey } from '@/utils/groupItems'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'

// Downloaded the first time it is opened, not with the page.
const GroupModal = dynamic(() => import('@/components/groups/GroupModal'), { loading: () => null })
const AddGameModal = dynamic(() => import('@/components/groups/add-game-modal/AddGameModal'), { loading: () => null })
import DeleteConfirmDialog from '@/components/groups/delete-confirm-dialog/DeleteConfirmDialog'
import GroupDetailHero from '@/components/groups/group-detail-hero/GroupDetailHero'
import GroupToolbar from '@/components/groups/group-toolbar/GroupToolbar'
import GroupCoverGrid from '@/components/groups/group-cover-grid/GroupCoverGrid'
import { coverSrc } from '@/components/groups/group-cover-mosaic/GroupCoverMosaic'
import { GROUP_DETAIL_VIEWS, type GroupDetailView } from '@/components/groups/group-view-toggle/GroupViewToggle'
import GroupGameGrid from '@/components/groups/group-game-grid/GroupGameGrid'
import GroupDetailSkeleton from '@/components/groups/group-detail-skeleton/GroupDetailSkeleton'
import Button from '@/components/ui/Button'

const PAGE = 'flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main'

/** A group of games: its banner and progress, one bar of filters, and its games (covers or a list) in the order chosen. */
export default function GroupDetailPage() {
  const { id } = useParams()
  const groupId = parseInt(id as string)
  const router = useRouter()
  const { T } = useLanguage()
  const { games: recentlyPlayed } = useRecentlyPlayedGames()
  const { group, status, retry, reorder, removeGame, addItems, edit, remove } = useGroupPage(groupId, recentlyPlayed)
  const { filters, active: filtersActive, setPct, setDecade, toggleConsole, clearConsoles, clear } = useGroupFilters()
  const [editOpen, setEditOpen] = useState(false)
  const [addGameOpen, setAddGameOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [view, setView] = useStoredChoice<GroupDetailView>('group-detail-view', GROUP_DETAIL_VIEWS, 'covers')

  const items = useMemo(() => group?.items ?? [], [group])
  const { ra, live, summary, states, progress } = useGroupProgress(items)
  const filtered = useMemo(() => filterGroupItems(items, filters, live, ra.ach), [items, filters, live, ra.ach])
  const covers = useMemo(() => items.map(coverSrc).filter((s): s is string => !!s).slice(0, 8), [items])
  const existingKeys = useMemo(() => new Set(items.map(itemKey)), [items])

  async function handleDelete() {
    if (await remove()) router.push('/groups')
  }

  if (status === 'missing' || status === 'error') {
    return (
      <div className={`${PAGE} justify-center gap-3 text-center`}>
        <p role="alert" className="text-text-secondary">{status === 'missing' ? T.groups.notFound : T.groups.loadError}</p>
        {status === 'error' ? (
          <button onClick={retry} className="text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded">
            {T.groups.retry}
          </button>
        ) : (
          <Link href="/groups" className="text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded">
            {T.groups.backToGroups}
          </Link>
        )}
      </div>
    )
  }

  return (
    <motion.div className={PAGE} variants={fadeUp} initial="hidden" animate="visible">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-5">
        {!group ? (
          <GroupDetailSkeleton />
        ) : (
          <>
            <GroupDetailHero
              group={group}
              covers={covers}
              gameCount={items.length}
              summary={summary}
              states={states}
              onAdd={() => setAddGameOpen(true)}
              onEdit={() => setEditOpen(true)}
              onDelete={() => setConfirmDelete(true)}
            />

            {items.length > 0 && (
              <GroupToolbar
                items={items}
                filters={filters}
                view={view}
                onView={setView}
                onPct={setPct}
                onDecade={setDecade}
                onToggleConsole={toggleConsole}
                onClearConsoles={clearConsoles}
                counts={states}
              />
            )}

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <p className="text-sm text-text-secondary">{T.groups.noGames}</p>
                <Button
                  onClick={() => setAddGameOpen(true)}
                >
                  {T.groups.addGame}
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <p className="text-sm text-text-secondary">{T.groups.noGamesFilter}</p>
                <button onClick={clear} className="text-xs text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded">
                  {T.groups.clearFilters}
                </button>
              </div>
            ) : view === 'covers' ? (
              <GroupCoverGrid items={filtered} progress={progress} draggable={!filtersActive} onRemove={removeGame} onReorder={reorder} />
            ) : (
              <GroupGameGrid
                items={filtered}
                draggable={!filtersActive}
                gridCols={2}
                ach={ra.ach}
                pts={ra.pts}
                lastPlayed={ra.lastPlayed}
                onRemove={removeGame}
                onReorder={reorder}
              />
            )}
          </>
        )}
      </div>

      <LazyWhenOpened open={addGameOpen}>
        <AddGameModal isOpen={addGameOpen} onClose={() => setAddGameOpen(false)} groupId={groupId} groupTitle={group?.title} existingKeys={existingKeys} onAdded={addItems} />
      </LazyWhenOpened>
      {group && (
        <LazyWhenOpened open={editOpen}>
          <GroupModal isOpen={editOpen} onClose={() => setEditOpen(false)} group={group} onSave={edit} />
        </LazyWhenOpened>
      )}
      <DeleteConfirmDialog isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete} />
    </motion.div>
  )
}
