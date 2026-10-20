'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconTrophy, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { gameHref, PLATFORM_NAME } from '@/utils/gameRef'
import type { ShowcaseItem } from '@/utils/showcase'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'

/**
 * One achievement of a showcase: its badge large, its name, its game (which it
 * opens) and when it was earned. On the user's own showcase it brings a
 * button to take it out and the grip to move it (`handle`); on someone's
 * profile, `subject` makes the game link open their progress.
 */
export default function ShowcaseTile({
  item,
  subject,
  onRemove,
  handle,
}: {
  item: ShowcaseItem
  subject?: string | null
  onRemove?: () => void
  handle?: ReactNode
}) {
  const { T, lang } = useLanguage()
  const date = new Date(item.earnedAt).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <article className="relative h-full bg-bg-main rounded-xl p-3 flex flex-col items-center gap-2 text-center ring-1 ring-ink/5">
      {handle && <span className="absolute left-1.5 top-1.5">{handle}</span>}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${T.showcase.remove}: ${item.title}`}
          className="absolute right-1.5 top-1.5 p-1 rounded-md text-text-secondary hover:text-text-main hover:bg-ink/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconX size={14} aria-hidden="true" />
        </button>
      )}
      {item.badge ? (
        <Image src={item.badge} alt="" width={64} height={64} className="w-16 h-16 rounded-xl object-cover shadow-lg shadow-black/30" unoptimized />
      ) : (
        <span aria-hidden="true" className="w-16 h-16 rounded-xl bg-ink/10 flex items-center justify-center text-text-secondary">
          <IconTrophy size={26} />
        </span>
      )}
      <span className="flex flex-col gap-0.5 min-w-0 w-full">
        <span className="text-sm font-semibold leading-tight line-clamp-2">{item.title}</span>
        <Link
          href={gameHref(item.source, item.gameId, subject)}
          className="flex items-center justify-center gap-1 text-[11px] text-text-secondary hover:text-text-main hover:underline min-w-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <PlatformLogo source={item.source} size={10} label={PLATFORM_NAME[item.source]} />
          <span className="truncate">{item.gameTitle}</span>
        </Link>
        <span className="text-[10px] text-text-secondary tabular-nums">{date}</span>
      </span>
      {item.description && <span className="sr-only">{item.description}</span>}
    </article>
  )
}
