'use client'

import GameIcon from '@/components/game-icon/GameIcon'
import { steamAssetUrl } from '@/lib/steamAssets'
import { psnBackdrop } from '@/utils/psnTitles'
import { xboxBackdrop } from '@/utils/xboxTitles'
import { entryId } from '@/utils/libraryShelves'
import type { LibraryEntry } from '@/utils/libraryInsights'

/** The square icon of a game, as its platform gives it (RA's is a path on its site). */
export function entryIcon(e: LibraryEntry): string | null {
  if (e.kind === 'ra') return e.game.ImageIcon ? `https://retroachievements.org${e.game.ImageIcon}` : null
  return e.game.imageIcon || null
}

/** The art to blur behind a card: Steam's wide header, PSN's hero or cover, else the icon. */
export function entryBackdrop(e: LibraryEntry): string | null {
  if (e.kind === 'steam') return steamAssetUrl(e.game.id, 'header')
  if (e.kind === 'psn') return psnBackdrop(e.game)
  if (e.kind === 'xbox') return xboxBackdrop(e.game)
  return entryIcon(e)
}

/** A game's icon, at the size asked. */
export default function LibraryEntryCover({ entry, size, className = '' }: { entry: LibraryEntry; size: number; className?: string }) {
  return (
    <span className={`block shrink-0 overflow-hidden rounded-tile ${className}`} style={{ width: size, height: size }}>
      <GameIcon source={entry.kind} id={entryId(entry)} imageUrl={entryIcon(entry)} size={size} className="w-full h-full rounded-none" />
    </span>
  )
}
