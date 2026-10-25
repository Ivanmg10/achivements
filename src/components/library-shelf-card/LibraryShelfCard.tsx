'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import LibraryEntryCover from '@/components/library-entry-cover/LibraryEntryCover'
import LibraryShelfBanner from '@/components/library-shelf-banner/LibraryShelfBanner'
import LibraryPlatformBadge from '@/components/library-platform-badge/LibraryPlatformBadge'
import LibraryEntryProgress from '@/components/library-entry-progress/LibraryEntryProgress'
import { entryCounts, entryHref, entryTotal, lastPlayedAgo } from '@/utils/libraryShelves'
import type { CardSize } from '@/utils/bentoLayout'
import type { LibraryEntry } from '@/utils/libraryInsights'

const SIZES: Record<CardSize, { banner: string; icon: number; title: string }> = {
  // The featured card is as tall as the rows it spans: its art takes what is left.
  feature: { banner: 'flex-1 min-h-56', icon: 96, title: 'text-xl' },
  wide: { banner: 'aspect-16/6', icon: 76, title: 'text-lg' },
  compact: { banner: 'aspect-video', icon: 60, title: 'text-sm' },
}

/**
 * One game on a shelf: the art across the top with its icon resting on the
 * edge, then the title, the progress and how far along and how long ago.
 *
 * Two things on the card open the game's own page: its icon and its name.
 * Everything else, the picture, the progress and the rest of the card, opens
 * the list on this game. That is a button stretched over the whole card, with
 * the two links above it (as the cards of the lists do), so no link is inside
 * a button nor the other way round.
 */
export default function LibraryShelfCard({ entry, size = 'compact', onPick }: { entry: LibraryEntry; size?: CardSize; onPick: (entry: LibraryEntry) => void }) {
  const { T, lang } = useLanguage()
  const counts = entryCounts(entry)
  const ago = lastPlayedAgo(entry.lastPlayed, lang)
  const total = entryTotal(entry)
  const { banner, icon, title } = SIZES[size]
  const href = entryHref(entry)

  return (
    <div className="group relative flex flex-col w-full h-full rounded-card bg-bg-card ring-1 ring-ink/5 hover:ring-ink/15 focus-within:ring-2 focus-within:ring-accent/70 transition-shadow">
      <div className={`relative rounded-t-2xl ${banner}`}>
        <LibraryShelfBanner entry={entry} />
        <span className="absolute left-3 top-3">
          <LibraryPlatformBadge source={entry.kind} />
        </span>
        {/* Same destination as the title, so it is kept out of the tab order. */}
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute left-3 bottom-0 translate-y-1/2 z-10 rounded-xl ring-2 ring-bg-card shadow-lg shadow-black/30 hover:ring-ink/40 transition-shadow"
        >
          <LibraryEntryCover entry={entry} size={icon} />
        </Link>
      </div>
      <div className="flex flex-col gap-3 px-4 pt-3 pb-4">
        <div className="min-h-8" style={{ paddingLeft: icon + 8 }}>
          <Link
            href={href}
            title={T.libraryLayout.openGame}
            className={`relative z-10 block w-fit max-w-full font-bold leading-tight line-clamp-2 hover:underline decoration-ink/50 underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${title}`}
          >
            {entry.title}
          </Link>
        </div>
        <LibraryEntryProgress pct={entry.pct} label={entry.title} />
        <div className="flex items-baseline justify-between gap-2 text-xs text-text-secondary">
          <span className="tabular-nums">
            {counts ? `${counts.earned}/${counts.total}` : total > 0 ? `${total} ${T.statusGameItem.achievements}` : ''}
          </span>
          <span>{ago}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onPick(entry)}
        aria-label={`${T.libraryLayout.openInList}: ${entry.title}`}
        className="absolute inset-0 z-[1] rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      />
    </div>
  )
}
