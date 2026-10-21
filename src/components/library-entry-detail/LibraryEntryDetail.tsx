'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useGameProgression } from '@/hooks/useGameProgression'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import LibraryPlatformBadge from '@/components/library-platform-badge/LibraryPlatformBadge'
import LibraryDetailBackdrop from '@/components/library-detail-backdrop/LibraryDetailBackdrop'
import { entryBackdrop } from '@/components/library-entry-cover/LibraryEntryCover'
import RaLibraryDetail from '@/components/ra-library-detail/RaLibraryDetail'
import SteamLibraryDetail from '@/components/steam/steam-library-detail/SteamLibraryDetail'
import PsnLibraryDetail from '@/components/psn/psn-library-detail/PsnLibraryDetail'
import XboxLibraryDetail from '@/components/xbox/xbox-library-detail/XboxLibraryDetail'
import { entryHref, entryId } from '@/utils/libraryShelves'
import type { LibraryEntry } from '@/utils/libraryInsights'

type Of<K extends LibraryEntry['kind']> = Extract<LibraryEntry, { kind: K }>

// RA's game is asked for when it is shown, as the cards ask when opened.
function RaBody({ entry, category }: { entry: Of<'ra'>; category: string }) {
  const id = entryId(entry)
  const { game, isLoading, error, refetch } = useGameProgression(String(id))
  return (
    <RaLibraryDetail
      game={entry.game}
      gameId={id}
      category={category}
      data={game}
      loading={isLoading || (!game && !error)}
      error={!!error}
      onRetry={refetch}
    />
  )
}

/**
 * A game's detail in the list view: its name (a link to the game), pin and
 * hide, and then the same detail the cards open to. Mounted per game, so each
 * one is asked for when it is shown, not for the whole list.
 */
export default function LibraryEntryDetail({ entry, category }: { entry: LibraryEntry; category: string }) {
  const { T } = useLanguage()
  const id = entryId(entry)

  return (
    <section aria-label={entry.title} className="relative isolate overflow-hidden flex flex-col gap-3 grow shrink-0 rounded-2xl bg-bg-card p-4 ring-1 ring-accent/30 shadow-lg shadow-black/10">
      <LibraryDetailBackdrop entry={entry} />
      <header className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href={entryHref(entry)}
            title={T.libraryLayout.openGame}
            className="min-w-0 text-2xl sm:text-3xl font-bold tracking-tight leading-tight truncate hover:underline decoration-ink/50 underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {entry.title}
          </Link>
          <LibraryPlatformBadge source={entry.kind} size="lg" />
        </div>
        <HideGameButton source={entry.kind} gameId={id} title={entry.title} image={entryBackdrop(entry)} />
        <PinToggleButton gameId={id} source={entry.kind} />
      </header>
      {entry.kind === 'ra' ? (
        <RaBody entry={entry} category={category} />
      ) : entry.kind === 'steam' ? (
        entry.game.hasStats ? (
          <SteamLibraryDetail game={entry.game} category={category} />
        ) : (
          <p className="text-center text-text-secondary text-sm py-2">{T.steam.noAchievements}</p>
        )
      ) : entry.kind === 'psn' ? (
        <PsnLibraryDetail game={entry.game} category={category} />
      ) : (
        <XboxLibraryDetail game={entry.game} category={category} />
      )}
    </section>
  )
}
