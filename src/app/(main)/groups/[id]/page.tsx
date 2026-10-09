'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'
import { useGamesData } from '@/context/GamesDataContext'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useGroupPage } from '@/hooks/useGroupPage'
import { useGroupFilters } from '@/hooks/useGroupFilters'
import { filterGroupItems, groupSummary, itemKey, liveProgressMap, raProgressMaps } from '@/utils/groupItems'
import GroupModal from '@/components/groups/GroupModal'
import AddGameModal from '@/components/groups/add-game-modal/AddGameModal'
import DeleteConfirmDialog from '@/components/groups/delete-confirm-dialog/DeleteConfirmDialog'
import GroupDetailHeader from '@/components/groups/group-detail-header/GroupDetailHeader'
import GroupFilters from '@/components/groups/group-filters/GroupFilters'
import GroupGameGrid from '@/components/groups/group-game-grid/GroupGameGrid'
import GroupDetailSkeleton from '@/components/groups/group-detail-skeleton/GroupDetailSkeleton'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

const PAGE = 'flex flex-col items-center min-h-screen bg-bg-main py-6 px-4 text-text-main'

/** A group of games: its header and progress, filters, and its games in the order chosen. */
export default function GroupDetailPage() {
  const { id } = useParams()
  const groupId = parseInt(id as string)
  const router = useRouter()
  const { T } = useLanguage()
  const { all: allGames } = useGamesData()
  const { games: recentlyPlayed } = useRecentlyPlayedGames()
  const { library: steamLibrary } = useSteamGamesData()
  const { library: psnLibrary } = usePsnGamesData()
  const { group, status, retry, reorder, removeGame, addItems, edit, remove } = useGroupPage(groupId, recentlyPlayed)
  const { filters, active: filtersActive, setPct, setDecade, toggleConsole, clearConsoles, clear } = useGroupFilters()
  const [editOpen, setEditOpen] = useState(false)
  const [addGameOpen, setAddGameOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [gridCols, setGridCols] = useState<StatusGridCols>(1)

  const ra = useMemo(() => raProgressMaps(recentlyPlayed, allGames), [recentlyPlayed, allGames])
  const live = useMemo(() => liveProgressMap(steamLibrary, psnLibrary), [steamLibrary, psnLibrary])
  const items = useMemo(() => group?.items ?? [], [group])
  const filtered = useMemo(() => filterGroupItems(items, filters, live), [items, filters, live])
  const summary = useMemo(() => groupSummary(items, ra.ach, live), [items, ra.ach, live])
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
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        {!group ? (
          <GroupDetailSkeleton />
        ) : (
          <>
            <GroupDetailHeader
              group={group}
              gameCount={items.length}
              summary={summary}
              gridCols={gridCols}
              onGridCols={setGridCols}
              onAdd={() => setAddGameOpen(true)}
              onEdit={() => setEditOpen(true)}
              onDelete={() => setConfirmDelete(true)}
            />

            {items.length > 0 && (
              <GroupFilters
                items={items}
                filters={filters}
                onPct={setPct}
                onDecade={setDecade}
                onToggleConsole={toggleConsole}
                onClearConsoles={clearConsoles}
              />
            )}

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <p className="text-sm text-text-secondary">{T.groups.noGames}</p>
                <button
                  onClick={() => setAddGameOpen(true)}
                  className="px-4 py-2 rounded-xl bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  {T.groups.addGame}
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <p className="text-sm text-text-secondary">{T.groups.noGamesFilter}</p>
                <button onClick={clear} className="text-xs text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded">
                  {T.groups.clearFilters}
                </button>
              </div>
            ) : (
              <GroupGameGrid
                items={filtered}
                draggable={!filtersActive}
                gridCols={gridCols}
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

      <AddGameModal isOpen={addGameOpen} onClose={() => setAddGameOpen(false)} groupId={groupId} existingKeys={existingKeys} onAdded={addItems} />
      {group && <GroupModal isOpen={editOpen} onClose={() => setEditOpen(false)} group={group} onSave={edit} />}
      <DeleteConfirmDialog isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete} />
    </motion.div>
  )
}
