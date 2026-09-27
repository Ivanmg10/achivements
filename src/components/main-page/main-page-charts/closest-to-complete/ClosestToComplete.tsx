'use client'

import { useLanguage } from '@/context/LanguageContext'
import { GameListRow } from '@/components/ui/GameListRow'

export type ClosestGame = {
  /** Unique within the list — game ids repeat across platforms. */
  key: string
  href: string
  title: string
  imageUrl?: string
  done: number
  total: number
  /** Completion as 0–100. */
  percent: number
}

/** Games shown. Three is a glance; more is a list to read. */
export const CLOSEST_SHOWN = 3

/**
 * The started games nearest to finished — the ones worth picking back up.
 *
 * Both mastery cards show it, so both feed it the same shape: what counts as
 * "complete" differs between platforms (a mastery on RA, every achievement on
 * Steam) but "how far along am I" does not.
 */
export default function ClosestToComplete({
  games,
  statClassName,
}: {
  games: ClosestGame[]
  statClassName?: string
}) {
  const { T } = useLanguage()

  if (games.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] text-text-secondary/60 uppercase tracking-widest">{T.cards.closestToPerfect}</p>
      {games.map((game) => (
        <GameListRow
          key={game.key}
          href={game.href}
          imageUrl={game.imageUrl}
          imageAlt={game.title}
          title={game.title}
          subtitle={`${game.done}/${game.total}`}
          stat={`${Math.round(game.percent)}%`}
          statClassName={statClassName}
        />
      ))}
    </div>
  )
}
