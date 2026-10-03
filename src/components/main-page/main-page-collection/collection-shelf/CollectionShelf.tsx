'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSpotlight } from '@/hooks/useSpotlight'
import { formatDate } from '@/utils/utils'
import type { LatestPerfect } from '@/utils/perfectGames'
import GameCover from '@/components/game-cover/GameCover'
import EmptyState from '@/components/empty-state/EmptyState'

/** Medal per place, metal-like; the number on it says the place too, so colour is never the only cue. */
const MEDALS = [
  'bg-linear-to-b from-amber-200 to-amber-500 text-amber-950',
  'bg-linear-to-b from-zinc-100 to-zinc-400 text-zinc-900',
  'bg-linear-to-b from-orange-300 to-orange-600 text-orange-950',
  'bg-linear-to-b from-bg-tertiary to-bg-main text-text-main ring-1 ring-white/10',
  'bg-linear-to-b from-bg-tertiary to-bg-main text-text-main ring-1 ring-white/10',
]

/**
 * The trophy cabinet: the latest games taken to 100%, newest first, as a row
 * of tiles in the same style as the page's other cards. Every box has the
 * same height and its own proportions (as on the game page), with its place
 * on a medal and name, console and date under it. On a phone the row scrolls
 * sideways.
 */
export default function CollectionShelf({ games, counts }: { games: LatestPerfect[]; counts: { hc: number; sc: number; steam: number } }) {
  const { T } = useLanguage()
  const reduce = useReducedMotion()
  const onPointerMove = useSpotlight()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-main">
          <IconTrophy size={16} className="text-warning" aria-hidden="true" />
          {T.cards.trophyCabinet}
        </h3>
        <p className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="text-warning font-semibold">{counts.hc} HC</span>
          <span aria-hidden="true">·</span>
          <span>{counts.sc} SC</span>
          {counts.steam > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#66c0f4] font-semibold">{counts.steam} Steam</span>
            </>
          )}
        </p>
      </div>

      {games.length === 0 ? (
        <EmptyState icon={<IconTrophy className="w-6 h-6" />} title={T.cards.noCompletedGames} subtitle={T.cards.noCompletedGamesSub} size="compact" />
      ) : (
        <ol className="grid grid-flow-col auto-cols-[minmax(8.5rem,1fr)] gap-3 overflow-x-auto snap-x [scrollbar-width:none]">
          {games.map((game, i) => (
            <motion.li
              key={game.key}
              className="snap-start"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: reduce ? 0 : 0.06 * i, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={game.source === 'steam' ? `/steamGame/${game.id}` : `/gameInfo/${game.id}`}
                onPointerMove={onPointerMove}
                className="spotlight group relative flex flex-col items-center gap-3 h-full rounded-xl bg-bg-main ring-1 ring-white/[0.04] p-3 hover:ring-white/15 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <span className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shadow-md shadow-black/40 ${MEDALS[i]}`}>
                  {i + 1}
                </span>
                {/* Same height for every box, standing on its bottom edge, own proportions. */}
                <span className="h-28 sm:h-32 w-full flex items-end justify-center transition-transform duration-300 group-hover:-translate-y-1">
                  <GameCover source={game.source} id={game.id} iconUrl={game.iconUrl} className="h-full" />
                </span>
                <span className="flex flex-col items-center w-full min-w-0">
                  <span className="text-xs font-semibold truncate max-w-full">{game.title}</span>
                  <span className="text-[11px] text-text-secondary truncate max-w-full">
                    {game.subtitle} · {formatDate(game.date)}
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  )
}
