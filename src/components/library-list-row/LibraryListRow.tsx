'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import LibraryEntryCover, { entryIcon } from '@/components/library-entry-cover/LibraryEntryCover'
import LibraryPlatformBadge from '@/components/library-platform-badge/LibraryPlatformBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { entryHref } from '@/utils/libraryShelves'
import type { LibraryEntry } from '@/utils/libraryInsights'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'

/**
 * One game in the list: icon, title and platform, progress, and when it was
 * played last. The current one is marked by a bar on its left and an outline,
 * not only a colour. The icon and the title open the game's own page; the rest
 * of the row shows the game beside the list. As on a shelf, that is a button
 * stretched over the row with the two links above it.
 */
export default function LibraryListRow({ entry, current, onSelect }: { entry: LibraryEntry; current: boolean; onSelect: (entry: LibraryEntry) => void }) {
  const { T, lang } = useLanguage()
  const played = entry.lastPlayed ? new Date(entry.lastPlayed).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' }) : null
  const href = entryHref(entry)
  const pct = entry.pct === null ? null : Math.min(100, Math.max(0, entry.pct))

  return (
    <div
      className={`relative isolate w-full flex items-center gap-3 rounded-xl p-2.5 transition-shadow focus-within:ring-2 focus-within:ring-accent/70 after:content-[''] after:absolute after:-z-[5] after:inset-0 after:rounded-[inherit] after:pointer-events-none after:transition-colors ${
        current
          ? 'after:bg-accent/10 after:shadow-[inset_3px_0_0_rgb(var(--accent)),inset_0_0_0_1px_rgb(var(--accent)/0.45)]'
          : 'hover:after:bg-accent/[0.06] hover:after:shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.5)]'
      }`}
    >
      {/* The game's colour: a flat tint and a border, as the home's rows. */}
      <GameCardBackdrop src={entryIcon(entry)} surface="main" />
      {/* Same destination as the title, so it is kept out of the tab order. */}
      <Link href={href} tabIndex={-1} aria-hidden="true" className="relative z-10 shrink-0 rounded-lg shadow-[0_6px_16px_rgb(0_0_0/0.45)] hover:ring-2 hover:ring-ink/40 transition-shadow">
        <LibraryEntryCover entry={entry} size={52} />
      </Link>
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={href}
            title={T.libraryLayout.openGame}
            className="relative z-10 min-w-0 font-bold truncate hover:underline decoration-ink/50 underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {entry.title}
          </Link>
          <LibraryPlatformBadge source={entry.kind} size="tag" />
        </div>
        {pct !== null && (
          <span className="flex items-center gap-2.5">
            <ProgressBar pct={pct} label={entry.title} className="flex-1" />
            <span className={`w-9 text-right text-[0.8125rem] font-extrabold tabular-nums ${pct >= 100 ? 'text-success' : ''}`}>{Math.round(pct)}%</span>
          </span>
        )}
        {played && <span className="text-xs text-text-secondary truncate">{T.statusGameItem.lastPlayed} · {played}</span>}
      </div>
      <button
        type="button"
        aria-current={current ? 'true' : undefined}
        onClick={() => onSelect(entry)}
        aria-label={entry.title}
        className="absolute inset-0 z-[1] rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      />
    </div>
  )
}
