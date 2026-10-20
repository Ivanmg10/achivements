'use client'

import { useId, useMemo } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { LibraryGame } from '@/utils/library'
import { normalizeTitle } from '@/utils/gameCandidates'
import ShowcasePickerModalGameRow from '../showcase-picker-modal-game-row/ShowcasePickerModalGameRow'

/** The picker's first view: the user's games with an achievement earned, searchable, each opening its achievements. */
export default function ShowcasePickerModalGames({
  games,
  isLoading,
  query,
  onQuery,
  selectedIn,
  onOpen,
}: {
  games: LibraryGame[]
  isLoading: boolean
  query: string
  onQuery: (q: string) => void
  /** How many achievements of a game (by its key) are selected. */
  selectedIn: (gameKey: string) => number
  onOpen: (game: LibraryGame) => void
}) {
  const { T } = useLanguage()
  const searchId = useId()
  const shown = useMemo(() => {
    const q = normalizeTitle(query.trim())
    return q ? games.filter((g) => normalizeTitle(g.title).includes(q)) : games
  }, [games, query])

  return (
    <>
      <div className="p-3 border-b border-bg-header">
        <label htmlFor={searchId} className="sr-only">{T.showcase.pickerSearch}</label>
        <div className="relative">
          <IconSearch size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={T.showcase.pickerSearch}
            className="w-full bg-bg-card rounded-xl pl-9 pr-3 py-2 text-sm placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          />
        </div>
      </div>
      <div className="overflow-y-auto overscroll-contain p-2 flex-1">
        {isLoading ? (
          <div aria-busy="true" className="flex flex-col gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-bg-card animate-pulse motion-reduce:animate-none" />
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
                <ShowcasePickerModalGameRow game={game} selected={selectedIn(game.key)} onOpen={() => onOpen(game)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
