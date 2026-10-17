'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconCircleCheck, IconLock } from '@tabler/icons-react'
import type { PinnedView } from '@/utils/pinnedView'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { gameHref } from '@/utils/gameRef'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import MainPageFavoritesUnpinButton from '@/components/main-page/main-page-favorites/main-page-favorites-unpin-button/MainPageFavoritesUnpinButton'

const TILE =
  'flex gap-3 w-full h-full rounded-xl p-3 bg-bg-main ring-1 ring-ink/[0.06] hover:ring-accent/40 transition-shadow text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/**
 * One pinned achievement as a tile: its badge large with the platform in the
 * corner, its name and description, the game, and how it stands — earned or
 * locked (said with an icon and a word, not the colour alone), its points,
 * grade or gamerscore, and how rare it is. RA's opens its detail modal; the
 * others link to it on the game's page. The star unpins it; the grip, when
 * given, moves it.
 */
export default function MainPagePinnedSectionAchievementTile({
  view,
  onOpen,
  onUnpin,
  handle,
}: {
  view: PinnedView
  onOpen?: () => void
  onUnpin: () => void
  handle?: ReactNode
}) {
  const { T } = useLanguage()
  const subject = useSubject()

  const body = (
    <>
      <span className="relative shrink-0 self-start">
        {view.iconUrl ? (
          <Image
            src={view.iconUrl}
            alt=""
            width={64}
            height={64}
            unoptimized
            className={`w-16 h-16 rounded-xl object-cover bg-ink/10 ${view.earned ? 'ring-2 ring-success/60' : 'grayscale opacity-60'}`}
          />
        ) : (
          <span className="block w-16 h-16 rounded-xl bg-ink/10" />
        )}
        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-bg-card ring-1 ring-ink/10 flex items-center justify-center">
          <PlatformLogo source={view.source} size={12} />
        </span>
      </span>

      <span className="flex flex-col min-w-0 flex-1 gap-1">
        <span className="text-sm font-semibold leading-snug line-clamp-2 pr-12">{view.title}</span>
        {view.description && <span className="text-xs text-text-secondary leading-snug line-clamp-2">{view.description}</span>}
        <span className="text-[11px] text-text-secondary truncate">{view.gameTitle}</span>
        <span className="mt-auto pt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
          <span className={`inline-flex items-center gap-1 font-semibold ${view.earned ? 'text-success' : 'text-text-secondary'}`}>
            {view.earned ? <IconCircleCheck size={13} aria-hidden="true" /> : <IconLock size={13} aria-hidden="true" />}
            {view.earned ? T.steam.earned : T.steam.locked}
          </span>
          {view.value && <span className={`font-semibold ${view.valueClass}`}>{view.value}</span>}
          {view.rarity !== null && (
            <span className="text-text-secondary tabular-nums">
              {view.rarity.toFixed(1)}
              {T.achievement.haveIt}
            </span>
          )}
        </span>
      </span>
    </>
  )

  return (
    <div className="relative h-full">
      {view.anchor === null ? (
        <button type="button" onClick={onOpen} className={TILE}>
          {body}
        </button>
      ) : (
        <Link href={`${gameHref(view.source, view.gameId, subject)}#${view.anchor}`} className={TILE}>
          {body}
        </Link>
      )}
      {/* Beside the link, not in it: a button inside a link is invalid. */}
      <span className="absolute top-3 right-3 flex items-center gap-1.5">
        {handle}
        <MainPageFavoritesUnpinButton onUnpin={onUnpin} />
      </span>
    </div>
  )
}
