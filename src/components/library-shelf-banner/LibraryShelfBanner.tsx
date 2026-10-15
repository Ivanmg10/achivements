'use client'

import Image from 'next/image'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import { entryBackdrop } from '@/components/library-entry-cover/LibraryEntryCover'
import { useRaScreenshot } from '@/hooks/useRaScreenshot'
import { entryId } from '@/utils/libraryShelves'
import type { LibraryEntry } from '@/utils/libraryInsights'

const FILL = 'absolute inset-0 w-full h-full object-cover'

/**
 * The art across the top of a shelf card. Steam's wide header, a PSN game's
 * hero and an RA game's title screen (or a frame of play) fill it as they are.
 * What has none, or has not yet arrived, gets its icon blown up and blurred,
 * so each card still has its game's colour without a blurry picture.
 * Decorative: the card says the game in words.
 */
export default function LibraryShelfBanner({ entry }: { entry: LibraryEntry }) {
  const screenshot = useRaScreenshot(entry.kind === 'ra' ? entryId(entry) : null)
  const art = screenshot ?? entryBackdrop(entry)
  const sharp = !!screenshot || (entry.kind === 'psn' && !!(entry.game.heroUrl || entry.game.coverUrl))

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-bg-tertiary">
      {entry.kind === 'steam' ? (
        <SteamGameImage appId={entry.game.id} asset="header" iconUrl={entry.game.imageIcon} size={460} className={FILL} />
      ) : art && sharp ? (
        <Image src={art} alt="" fill unoptimized sizes="480px" className="object-cover" />
      ) : art ? (
        <>
          <Image src={art} alt="" width={96} height={96} unoptimized className={`${FILL} scale-150 blur-2xl saturate-150 opacity-90`} />
          <div className="absolute inset-0 bg-black/25" />
        </>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-bg-card/70 to-transparent" />
    </div>
  )
}
