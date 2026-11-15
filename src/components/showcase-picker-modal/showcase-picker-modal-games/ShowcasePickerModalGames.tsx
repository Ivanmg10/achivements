'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { LibraryGame } from '@/utils/library'
import { normalizeTitle } from '@/utils/gameCandidates'
import ShowcasePickerModalGameRow from '../showcase-picker-modal-game-row/ShowcasePickerModalGameRow'
import type { ShowcasePlatform } from '../showcase-picker-modal-filters/ShowcasePickerModalFilters'
import { SkeletonRow } from '@/components/ui/SkeletonList'

/**
 * The picker's list of games: the user's games with an achievement earned as rows, narrowed by the search and the
 * platform chosen in the Modal's toolbar, each opening its achievements.
 */
export default function ShowcasePickerModalGames({
  games,
  isLoading,
  query,
  platform,
  selectedIn,
  openKey,
  onOpen,
}: {
  games: LibraryGame[]
  isLoading: boolean
  query: string
  platform: ShowcasePlatform
  /** How many achievements of a game (by its key) are selected. */
  selectedIn: (gameKey: string) => number
  /** The game whose achievements are showing. */
  openKey?: string
  onOpen: (game: LibraryGame) => void
}) {
  const { T } = useLanguage()
  const shown = useMemo(() => {
    const q = normalizeTitle(query.trim())
    return games.filter((g) => (platform === 'all' || g.source === platform) && (!q || normalizeTitle(g.title).includes(q)))
  }, [games, query, platform])

  return (
      <div className="lg:overflow-y-auto lg:overscroll-contain lg:min-h-0 lg:flex-1 -mx-1 px-1">
        {isLoading ? (
          <div aria-busy="true" className="flex flex-col gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonRow key={i} className="h-14 bg-bg-card rounded-tile px-2 gap-3" />
            ))}
          </div>
        ) : games.length === 0 ? (
          <p className="py-10 text-center text-sm text-text-secondary">{T.showcase.pickerNone}</p>
        ) : shown.length === 0 ? (
          <p role="status" className="py-10 text-center text-sm text-text-secondary">{T.showcase.pickerNoMatch}</p>
        ) : (
          <ul aria-label={T.showcase.gamesLabel} className="flex flex-col gap-1">
            {shown.map((game) => (
              <li key={game.key}>
                <ShowcasePickerModalGameRow game={game} selected={selectedIn(game.key)} current={game.key === openKey} onOpen={() => onOpen(game)} />
              </li>
            ))}
          </ul>
        )}
      </div>
  )
}
