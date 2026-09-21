'use client'

import { IconBrandSteam } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import SteamGameItem from '../steam-game-item/SteamGameItem'
import EmptyState from '@/components/empty-state/EmptyState'
import type { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'

const SKELETON_CARDS = 4

/** Mirrors the RA list's column picker; collapses to one column on phones. */
const GRID_CLASS: Record<StatusGridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}

/**
 * The Steam games belonging to one category page, shown as their own section
 * under the RA list rather than mixed into it: the RA list's filtering,
 * sorting and console pills are all built on RA fields Steam games do not
 * have. Renders nothing for users without Steam linked.
 */
export default function SteamCategorySection({
  category,
  gridCols = 2,
}: {
  category: string
  gridCols?: StatusGridCols
}) {
  const { T } = useLanguage()
  const { games, isLinked, loading, error, progressTruncated, refetch } = useSteamGamesByCategory(category)

  if (!isLinked) return null

  const headingId = `steam-section-${category}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 w-full">
      <div className="flex items-baseline gap-2 flex-wrap">
        <h2 id={headingId} className="flex items-center gap-2 text-xl font-bold">
          <IconBrandSteam size={22} className="text-[#66c0f4]" aria-hidden="true" />
          {T.steam.gamesSection}
        </h2>
        {!loading && !error && <span className="text-sm text-text-secondary">{games.length}</span>}
      </div>

      {progressTruncated && category !== 'wantToPlay' && !loading && !error && (
        <p className="text-xs text-text-secondary">{T.steam.partialProgressNote}</p>
      )}

      {loading ? (
        <div aria-busy="true" className={`grid gap-3 ${GRID_CLASS[gridCols]}`}>
          {Array.from({ length: SKELETON_CARDS }).map((_, i) => (
            <div key={i} className="h-20 bg-bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-red-400">
            {T.steam.gamesError}
          </p>
          <p className="text-xs text-text-secondary">{T.steam.privateProfileHint}</p>
          <button
            onClick={refetch}
            className="text-xs bg-bg-card px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
          >
            {T.steam.retry}
          </button>
        </div>
      ) : games.length === 0 ? (
        <EmptyState
          size="compact"
          icon={<IconBrandSteam className="w-6 h-6" />}
          title={T.steam.noGamesInCategory}
          className="py-6"
        />
      ) : (
        // items-start: an expanded card must not stretch its row neighbours.
        <div className={`grid gap-3 items-start ${GRID_CLASS[gridCols]}`}>
          {games.map((g) => (
            <SteamGameItem key={g.id} game={g} />
          ))}
        </div>
      )}
    </section>
  )
}
