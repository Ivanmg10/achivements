'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import LibraryEntryCover from '@/components/library-entry-cover/LibraryEntryCover'
import LibraryPlatformBadge from '@/components/library-platform-badge/LibraryPlatformBadge'
import LibraryEntryProgress from '@/components/library-entry-progress/LibraryEntryProgress'
import { entryHref } from '@/utils/libraryShelves'
import type { LibraryEntry } from '@/utils/libraryInsights'

/**
 * One game in the list: icon, title, platform, last played and progress. The
 * current one is outlined, not only coloured. The icon and the title open the
 * game's own page; the rest of the row shows the game beside the list. As on a
 * shelf, that is a button stretched over the row with the two links above it.
 */
export default function LibraryListRow({ entry, current, onSelect }: { entry: LibraryEntry; current: boolean; onSelect: (entry: LibraryEntry) => void }) {
  const { T, lang } = useLanguage()
  const played = entry.lastPlayed ? new Date(entry.lastPlayed).toLocaleDateString(lang) : null
  const href = entryHref(entry)

  return (
    <div
      className={`relative w-full grid grid-cols-[52px_1fr] items-center gap-3 rounded-2xl bg-bg-card p-2 pr-3 ring-1 transition-shadow focus-within:ring-2 focus-within:ring-accent/70 ${
        current ? 'ring-2 ring-accent' : 'ring-ink/5 hover:ring-ink/15'
      }`}
    >
      {/* Same destination as the title, so it is kept out of the tab order. */}
      <Link href={href} tabIndex={-1} aria-hidden="true" className="relative z-10 rounded-xl hover:ring-2 hover:ring-ink/40 transition-shadow">
        <LibraryEntryCover entry={entry} size={52} />
      </Link>
      <div className="flex flex-col gap-1.5 min-w-0">
        <Link
          href={href}
          title={T.libraryLayout.openGame}
          className="relative z-10 self-start max-w-full text-sm font-semibold truncate hover:underline decoration-ink/50 underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {entry.title}
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <LibraryPlatformBadge source={entry.kind} />
          {played && <span className="text-[11px] text-text-secondary truncate">{T.statusGameItem.lastPlayed} · {played}</span>}
        </div>
        <LibraryEntryProgress source={entry.kind} pct={entry.pct} label={entry.title} />
      </div>
      <button
        type="button"
        aria-current={current ? 'true' : undefined}
        onClick={() => onSelect(entry)}
        aria-label={entry.title}
        className="absolute inset-0 z-[1] rounded-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      />
    </div>
  )
}
