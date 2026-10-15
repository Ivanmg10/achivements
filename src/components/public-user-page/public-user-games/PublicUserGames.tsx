'use client'

import { useId, useMemo, useState } from 'react'
import { IconDeviceGamepad2, IconSearch } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { filterLibrary, type LibraryGame, type LibraryStatus } from '@/utils/library'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'
import EmptyState from '@/components/empty-state/EmptyState'
import PublicUserGameRow from '../public-user-game-row/PublicUserGameRow'

const PAGE = 30

type Sort = 'progress' | 'name'

const CHIP = 'px-3 py-1 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'
const chipClass = (on: boolean) =>
  `${CHIP} ${on ? 'bg-bg-header text-text-main ring-1 ring-text-secondary/30' : 'bg-bg-main text-text-secondary hover:text-text-main'}`

/**
 * Every game a user has played, searchable and filtered by platform and
 * state, furthest along first (or by name). Each opens their progress in it.
 */
export default function PublicUserGames({ games, isLoading }: { games: LibraryGame[]; isLoading: boolean }) {
  const { T, lang } = useLanguage()
  const searchId = useId()
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<GameSource | 'all'>('all')
  const [status, setStatus] = useState<LibraryStatus | 'all'>('all')
  const [sort, setSort] = useState<Sort>('progress')
  const [shown, setShown] = useState(PAGE)

  // Another filter starts the list from its top again.
  useWhenChanged([query, source, status, sort], () => setShown(PAGE))

  const platforms = (['ra', 'steam', 'psn'] as const).filter((s) => games.some((g) => g.source === s))
  const filtered = useMemo(() => {
    const list = filterLibrary(games, { query, source, status })
    return list.sort((a, b) => (sort === 'name' ? a.title.localeCompare(b.title, lang) : b.pct - a.pct || a.title.localeCompare(b.title, lang)))
  }, [games, query, source, status, sort, lang])

  if (isLoading) {
    return (
      <div aria-busy="true" className="bg-bg-card rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        <span className="sr-only">{T.userProfile.loadingGames}</span>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-16 rounded-xl bg-bg-main animate-pulse motion-reduce:animate-none" />
        ))}
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="bg-bg-card rounded-xl p-8">
        <EmptyState icon={<IconDeviceGamepad2 className="w-6 h-6" />} title={T.userProfile.noGames} />
      </div>
    )
  }

  return (
    <div className="bg-bg-card rounded-xl p-4 flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <label htmlFor={searchId} className="sr-only">{T.userProfile.searchGames}</label>
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={T.userProfile.searchGames}
            className="w-full bg-bg-main rounded-xl pl-9 pr-3 py-2 text-sm placeholder:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`${searchId}-sort`} className="text-xs text-text-secondary">{T.userProfile.sortBy}</label>
          <select
            id={`${searchId}-sort`}
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="bg-bg-main rounded-xl px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <option value="progress">{T.userProfile.sortProgress}</option>
            <option value="name">{T.userProfile.sortName}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {platforms.length > 1 && (
          <div role="group" aria-label={T.userProfile.platformFilter} className="flex flex-wrap gap-1.5">
            {(['all', ...platforms] as const).map((s) => (
              <button key={s} type="button" aria-pressed={source === s} onClick={() => setSource(s)} className={chipClass(source === s)}>
                {s === 'all' ? T.userProfile.allPlatforms : PLATFORM_NAME[s]}
              </button>
            ))}
          </div>
        )}
        <div role="group" aria-label={T.userProfile.statusFilter} className="flex flex-wrap gap-1.5">
          {(['all', 'playing', 'completed'] as const).map((s) => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} className={chipClass(status === s)}>
              {s === 'all' ? T.userProfile.allStates : s === 'playing' ? T.userProfile.playing : T.userProfile.completed}
            </button>
          ))}
        </div>
        <p role="status" className="text-xs text-text-secondary ml-auto tabular-nums">
          {T.userProfile.gamesCount.replace('{n}', filtered.length.toLocaleString(lang))}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<IconSearch className="w-6 h-6" />} title={T.userProfile.noGamesMatch} size="compact" className="py-8" />
      ) : (
        <>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filtered.slice(0, shown).map((g) => (
              <li key={g.key} className="min-w-0">
                <PublicUserGameRow game={g} />
              </li>
            ))}
          </ul>
          {filtered.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="self-center rounded-full bg-bg-main px-4 py-1.5 text-xs font-medium text-text-secondary hover:text-text-main hover:bg-ink/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {T.userProfile.showMore.replace('{n}', (filtered.length - shown).toLocaleString(lang))}
            </button>
          )}
        </>
      )}
    </div>
  )
}
