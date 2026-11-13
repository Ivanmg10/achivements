'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { LibraryGame } from '@/utils/library'
import type { GameSource } from '@/types/game'
import { normalizeTitle } from '@/utils/gameCandidates'
import { GAME_SOURCES, PLATFORM_NAME } from '@/utils/gameRef'
import ShowcasePickerModalGameRow from '../showcase-picker-modal-game-row/ShowcasePickerModalGameRow'
import Pill from '@/components/ui/Pill'
import SearchInput from '@/components/ui/SearchInput'
import { Skeleton } from '@/components/ui/Skeleton'
import { SkeletonRow } from '@/components/ui/SkeletonList'

export type ShowcasePlatform = GameSource | 'all'

/**
 * The picker's list of games: the user's games with an achievement earned as rows, searchable and filtered by
 * platform (the chips only when more than one platform has games), each opening its achievements.
 */
export default function ShowcasePickerModalGames({
  games,
  isLoading,
  query,
  onQuery,
  platform,
  onPlatform,
  selectedIn,
  openKey,
  onOpen,
}: {
  games: LibraryGame[]
  isLoading: boolean
  query: string
  onQuery: (q: string) => void
  platform: ShowcasePlatform
  onPlatform: (p: ShowcasePlatform) => void
  /** How many achievements of a game (by its key) are selected. */
  selectedIn: (gameKey: string) => number
  /** The game whose achievements are showing. */
  openKey?: string
  onOpen: (game: LibraryGame) => void
}) {
  const { T } = useLanguage()
  const platforms = useMemo(() => GAME_SOURCES.filter((s) => games.some((g) => g.source === s)), [games])
  const shown = useMemo(() => {
    const q = normalizeTitle(query.trim())
    return games.filter((g) => (platform === 'all' || g.source === platform) && (!q || normalizeTitle(g.title).includes(q)))
  }, [games, query, platform])

  return (
    <>
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <Skeleton radius="field" className="h-10" />
        ) : (
          <SearchInput value={query} onChange={(e) => onQuery(e.target.value)} placeholder={T.showcase.pickerSearch} aria-label={T.showcase.pickerSearch} />
        )}
        {!isLoading && platforms.length > 1 && (
          <div role="group" aria-label={T.showcase.platformFilter} className="flex flex-wrap gap-1.5">
            <Pill pressed={platform === 'all'} onClick={() => onPlatform('all')}>{T.libraryFilters.all}</Pill>
            {platforms.map((s) => (
              <Pill key={s} pressed={platform === s} count={games.filter((g) => g.source === s).length} onClick={() => onPlatform(s)}>
                {PLATFORM_NAME[s]}
              </Pill>
            ))}
          </div>
        )}
      </div>
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
    </>
  )
}
