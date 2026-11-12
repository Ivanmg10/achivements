'use client'

import { useState } from 'react'
import Image from 'next/image'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import { entryBackdrop } from '@/components/library-entry-cover/LibraryEntryCover'
import { useRaScreenshot } from '@/hooks/useRaScreenshot'
import { useXboxGameDetails } from '@/hooks/useXboxGameDetails'
import { sharpEnough } from '@/utils/homeHero'
import { entryId } from '@/utils/libraryShelves'
import type { LibraryEntry } from '@/utils/libraryInsights'

const FILL = 'absolute inset-0 w-full h-full object-cover'

/**
 * The art across the top of a shelf card. Steam's wide header, a PSN game's
 * hero, an Xbox game's IGDB backdrop (the one its page uses; Xbox sends no
 * wide art) and an RA game's title screen (or a frame of play) fill it as they are,
 * once loaded and judged for the box as the home's cover judges its art
 * (`sharpEnough`): a picture stretched far past its size (a 320 px title screen
 * on a big card) reads as a blur, so it gives way to the fallback.
 * What has none, too small a one, or one not yet arrived, gets its icon blown up and blurred,
 * so each card still has its game's colour without a blurry picture.
 * Decorative: the card says the game in words.
 */
export default function LibraryShelfBanner({ entry }: { entry: LibraryEntry }) {
  const screenshot = useRaScreenshot(entry.kind === 'ra' ? entryId(entry) : null)
  const { details: xbox } = useXboxGameDetails(entry.kind === 'xbox' ? String(entryId(entry)) : null)
  // The wide picture found too small for this box: the fallback takes its place.
  const [tooSmall, setTooSmall] = useState<string | null>(null)
  const wide = screenshot ?? xbox?.heroUrl ?? undefined
  const art = wide ?? entryBackdrop(entry)
  const sharp = !!wide || (entry.kind === 'psn' && !!(entry.game.heroUrl || entry.game.coverUrl))
  const blurred = art === tooSmall ? entryBackdrop(entry) : art

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-bg-tertiary">
      {entry.kind === 'steam' ? (
        <SteamGameImage appId={entry.game.id} asset="header" iconUrl={entry.game.imageIcon} size={460} className={FILL} />
      ) : art && sharp && art !== tooSmall ? (
        <Image
          src={art}
          alt=""
          fill
          unoptimized
          sizes="480px"
          className="object-cover"
          onLoad={({ currentTarget: img }) => {
            if (!sharpEnough(img.naturalWidth, img.naturalHeight, img.clientWidth, img.clientHeight)) setTooSmall(art)
          }}
        />
      ) : blurred ? (
        <>
          <Image src={blurred} alt="" width={96} height={96} unoptimized className={`${FILL} scale-150 blur-2xl saturate-150 opacity-90`} />
          <div className="absolute inset-0 bg-black/25" />
        </>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-bg-card/70 to-transparent" />
    </div>
  )
}
