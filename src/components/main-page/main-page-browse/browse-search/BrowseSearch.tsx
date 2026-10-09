'use client'

import { useId, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconSearch } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { filterLibrary, LibraryFilter, LibraryGame, LibraryStatus } from '@/utils/library'
import type { GameSource } from '@/types/steam'
import BrowseSearchChips from '../browse-search-chips/BrowseSearchChips'

const SHOWN = 4

/**
 * Search across every library, with the platform and status a tap away.
 * Shows the first matches as rows that open the game; says how many more.
 */
export default function BrowseSearch({ library }: { library: LibraryGame[] }) {
  const { T } = useLanguage()
  const inputId = useId()
  const [filter, setFilter] = useState<LibraryFilter>({ query: '', source: 'all', status: 'all' })
  const matches = useMemo(() => filterLibrary(library, filter), [library, filter])

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={inputId} className="text-[10px] uppercase tracking-widest text-text-secondary">
        {T.cards.searchTitle}
      </label>
      <div className="relative">
        <IconSearch size={15} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        <input
          id={inputId}
          type="search"
          value={filter.query}
          onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
          placeholder={T.cards.searchPlaceholder}
          className="w-full bg-bg-main rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-main placeholder:text-text-secondary outline-none ring-1 ring-ink/[0.06] focus-visible:ring-2 focus-visible:ring-accent/70"
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <BrowseSearchChips<GameSource | 'all'>
          label={T.cards.filterPlatform}
          value={filter.source}
          onChange={(source) => setFilter((f) => ({ ...f, source }))}
          options={[
            { value: 'all', label: T.cards.filterAll },
            { value: 'ra', label: 'RetroAchievements' },
            { value: 'steam', label: 'Steam' },
            { value: 'psn', label: 'PlayStation' },
          ]}
        />
        <BrowseSearchChips<LibraryStatus | 'all'>
          label={T.cards.filterStatus}
          value={filter.status}
          onChange={(status) => setFilter((f) => ({ ...f, status }))}
          options={[
            { value: 'all', label: T.cards.filterAll },
            { value: 'wantToPlay', label: T.categories.wantToPlay },
            { value: 'playing', label: T.categories.playing },
            { value: 'completed', label: T.categories.completed },
          ]}
        />
      </div>

      {matches.length === 0 ? (
        <p className="text-xs text-text-secondary py-4 text-center">{T.cards.noMatches}</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {matches.slice(0, SHOWN).map((g) => (
            <li key={g.key}>
              <Link
                href={g.href}
                className="flex items-center gap-2.5 rounded-xl bg-bg-main p-2 hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 min-w-0"
              >
                {g.iconUrl ? (
                  <Image src={g.iconUrl} alt="" width={32} height={32} unoptimized className="w-8 h-8 rounded-md object-cover shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded-md bg-ink/10 shrink-0" aria-hidden="true" />
                )}
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold truncate">{g.title}</span>
                  <span className="text-[10px] text-text-secondary truncate">
                    {g.subtitle} · {T.categories[g.status]}
                  </span>
                </span>
                <span className="text-[11px] tabular-nums text-text-secondary shrink-0">{g.pct}%</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {matches.length > SHOWN && (
        <p className="text-[11px] text-text-secondary text-center">{T.cards.moreMatches.replace('{n}', String(matches.length - SHOWN))}</p>
      )}
    </div>
  )
}
