'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SkeletonRow } from '@/components/ui/SkeletonList'

const SHOWN = 4
const SKELETON_ROWS = 4

/** One earned achievement or trophy as the panel lists it. */
export type RarestRow = {
  key: string
  name: string
  icon: string | null
  /** Where it lands on the game's page; stays on the profile being looked at (`gameHref(source, id, subject)`). None (the landing's example): a plain row. */
  href?: string
  /** Share of players who have it: what the panel orders by, rarest first. */
  rarity: number
  /** The line under the name, in the platform's own words (grade, `N G`, "x % have it"). */
  subline: ReactNode
}

const ROW = 'flex items-center gap-3 rounded-box p-1.5'

/** A row's frame: a link when it opens something, a plain row when it does not. */
function RowFrame({ href, children }: { href?: string; children: ReactNode }) {
  return href ? (
    <Link href={href} className={`${ROW} hover:bg-ink/5 transition-colors focus-ring`}>{children}</Link>
  ) : (
    <div className={ROW}>{children}</div>
  )
}

/**
 * The player's rarest earned achievements in a game, rarest first: the slot RA's expanded card gives to
 * pinned achievements. The adapter gives the earned ones with a known rarity as rows; the panel orders,
 * cuts to the rarest few, and holds its room while they load. `ring` is the platform's colour on each picture.
 */
export default function RarestEarned({
  title,
  empty,
  isLoading,
  rows,
  ring,
}: {
  title: string
  empty: string
  isLoading: boolean
  rows: RarestRow[]
  /** A `ring-*` class for the pictures: the platform's colour. */
  ring: string
}) {
  const rarest = [...rows].sort((a, b) => a.rarity - b.rarity).slice(0, SHOWN)

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-text-secondary text-sm px-1">{title}</p>

      {isLoading ? (
        <ul aria-busy="true" className="flex flex-col gap-2">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <li key={i}><SkeletonRow className="h-12 px-1" /></li>
          ))}
        </ul>
      ) : rarest.length === 0 ? (
        <p className="flex-1 flex items-center justify-center text-center text-sm text-text-secondary px-4 py-6">{empty}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rarest.map((r) => (
            <li key={r.key}>
              <RowFrame href={r.href}>
                {r.icon ? (
                  <Image src={r.icon} alt="" width={40} height={40} className={`w-10 h-10 rounded-box object-cover ring-2 ${ring} shrink-0`} unoptimized />
                ) : (
                  <div className="w-10 h-10 rounded-box bg-ink/10 shrink-0" aria-hidden="true" />
                )}
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{r.name}</span>
                  <span className="text-xs">{r.subline}</span>
                </span>
              </RowFrame>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
