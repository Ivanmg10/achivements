'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { LibraryEntry } from '@/utils/libraryInsights'
import { STATUS_GRID_COLS } from '@/components/statusGameList/StatusGameList'
import StatusGameItem from '@/components/statusGameList/StatusGameItem'
import SteamStatusGameItem from '@/components/steam/steam-status-game-item/SteamStatusGameItem'
import PsnStatusGameItem from '@/components/psn/psn-status-game-item/PsnStatusGameItem'
import XboxStatusGameItem from '@/components/xbox/xbox-status-game-item/XboxStatusGameItem'
import EmptyState from '@/components/empty-state/EmptyState'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import { IconFilterOff } from '@tabler/icons-react'

/** Every platform's games in one grid, in the order it is given; each card is its platform's own. */
export default function LibraryAllList({
  entries,
  category,
  gridCols = 2,
}: {
  entries: LibraryEntry[]
  category: string
  gridCols?: StatusGridCols
}) {
  const { T } = useLanguage()

  if (entries.length === 0) {
    return <EmptyState size="compact" icon={<IconFilterOff className="w-6 h-6" />} title={T.libraryFilters.noMatches} className="py-10" />
  }

  return (
    <div className={`grid gap-3 items-start w-full enter-cards ${STATUS_GRID_COLS[gridCols]}`}>
      {entries.map((e) =>
        e.kind === 'ra' ? (
          <StatusGameItem key={e.key} game={e.game} extra={e.extra} category={category} />
        ) : e.kind === 'steam' ? (
          <SteamStatusGameItem key={e.key} game={e.game} category={category} />
        ) : e.kind === 'psn' ? (
          <PsnStatusGameItem key={e.key} game={e.game} category={category} />
        ) : (
          <XboxStatusGameItem key={e.key} game={e.game} category={category} />
        ),
      )}
    </div>
  )
}
