'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { formatDate } from '@/utils/utils'
import type { LatestPerfect } from '@/utils/perfectGames'
import GameCover from '@/components/game-cover/GameCover'

/**
 * Where each finisher stands, by recency (index 0 is the newest): the newest
 * in the middle on the tallest step, the next on the left, the third on the
 * right. Medal colours mark the steps, and the number on each says it too.
 */
const STEPS = [
  { order: 'order-2', step: 'h-8', cover: 'h-32 sm:h-36', medal: 'text-amber-300 border-amber-300/60' },
  { order: 'order-1', step: 'h-6.5', cover: 'h-28 sm:h-32', medal: 'text-zinc-300 border-zinc-300/50' },
  { order: 'order-3', step: 'h-5', cover: 'h-24 sm:h-28', medal: 'text-orange-400 border-orange-400/50' },
]

/**
 * The latest games taken to 100%, on a podium, with the cover the game page
 * uses (RA box art, Steam's portrait) at its own proportions: box art runs
 * from tall PS2 cases to wide cartridge labels, and cropping it to one shape
 * cut the box apart. Height sets the place; the width follows the art.
 * In the DOM they stay newest first, so
 * a screen reader hears them in that order whatever the visual arrangement.
 */
export default function PerfectPodium({ games }: { games: LatestPerfect[] }) {
  const { T } = useLanguage()
  const reduce = useReducedMotion()

  if (games.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.latestPerfects}</p>
      <ol className="grid grid-cols-3 items-end gap-2 sm:gap-3 max-w-md mx-auto w-full">
        {games.map((game, i) => {
          const s = STEPS[i]
          const href = game.source === 'steam' ? `/steamGame/${game.id}` : `/gameInfo/${game.id}`
          return (
            <motion.li
              key={game.key}
              className={`${s.order} flex flex-col items-center gap-2 min-w-0`}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: reduce ? 0 : 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={href}
                className="group w-full flex flex-col items-center gap-2 min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <span className="transition-transform duration-300 group-hover:-translate-y-1 max-w-full flex justify-center">
                  <GameCover source={game.source} id={game.id} iconUrl={game.iconUrl} className={s.cover} />
                </span>
                <span className="w-full text-center flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate group-hover:underline underline-offset-2">{game.title}</span>
                  <span className="text-[10px] text-text-secondary truncate">{formatDate(game.date)}</span>
                </span>
              </Link>
              <span
                className={`w-full ${s.step} rounded-t-lg bg-bg-main border-t-2 ${s.medal} flex items-start justify-center pt-0.5 text-xs font-bold tabular-nums`}
              >
                {i + 1}
              </span>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
