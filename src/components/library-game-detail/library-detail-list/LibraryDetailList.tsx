'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { formatRarity } from '@/utils/steamFeed'
import type { InsightAchievement } from '@/utils/gameInsights'

const SKELETON_ROWS = 4

/**
 * A short list of a game's achievements, each a link to it, with how rare it
 * is — the next ones to go for, or the rarest already earned. Works for any
 * platform's achievements, so the cards of RA, Steam and PSN share it.
 */
export default function LibraryDetailList({
  title,
  items,
  empty,
  isLoading = false,
}: {
  title: string
  items: InsightAchievement[]
  /** Said when there is nothing to list. */
  empty: string
  isLoading?: boolean
}) {
  const { T } = useLanguage()

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-text-secondary text-sm px-1">{title}</p>

      {isLoading ? (
        <ul aria-busy="true" className="flex flex-col gap-2">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <li key={i} className="h-12 bg-ink/5 rounded-lg animate-pulse" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="flex-1 flex items-center justify-center text-center text-sm text-text-secondary px-4 py-6">{empty}</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={a.href}
                title={a.description}
                className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                {a.iconUrl ? (
                  <Image src={a.iconUrl} alt="" width={40} height={40} unoptimized className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-ink/10 shrink-0" aria-hidden="true" />
                )}
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold truncate">{a.title}</span>
                  <span className="text-xs text-text-secondary truncate">{a.description}</span>
                </span>
                <span className="flex flex-col items-end shrink-0 text-[11px] tabular-nums text-text-secondary">
                  {a.rarity !== null && <span>{T.libraryDetail.rarityOf.replace('{n}', formatRarity(a.rarity))}</span>}
                  {a.points !== null && <span className="text-text-main font-medium">{a.points} {T.libraryDetail.pointsShort}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
