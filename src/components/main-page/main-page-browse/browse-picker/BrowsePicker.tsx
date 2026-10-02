'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { IconArrowRight, IconDice5, IconRefresh } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { LibraryGame } from '@/utils/library'
import GameCover from '@/components/game-cover/GameCover'
import EmptyState from '@/components/empty-state/EmptyState'

/** Roulette steps and how much each waits longer than the last: fast, then settling. */
const STEPS = 14
const FIRST_DELAY = 45
const SLOWDOWN = 1.22

function randomOther(pool: LibraryGame[], not?: LibraryGame | null): LibraryGame {
  if (pool.length === 1) return pool[0]
  let next = pool[Math.floor(Math.random() * pool.length)]
  while (next.key === not?.key) next = pool[Math.floor(Math.random() * pool.length)]
  return next
}

/**
 * "What should I play?": spins through what is being played and what is
 * wanted, settles on one and shows it with its cover, as the game page does.
 * The spin is feedback that something is being chosen; with reduced motion
 * it simply lands. The result is announced politely when it settles.
 */
export default function BrowsePicker({ pool }: { pool: LibraryGame[] }) {
  const { T } = useLanguage()
  const reduce = useReducedMotion()
  const [picked, setPicked] = useState<LibraryGame | null>(null)
  const [rolling, setRolling] = useState<LibraryGame | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function spin() {
    clearTimeout(timer.current)
    const final = randomOther(pool, picked)
    if (reduce || pool.length === 1) {
      setRolling(null)
      setPicked(final)
      return
    }
    setPicked(null)
    let step = 0
    let delay = FIRST_DELAY
    const tick = () => {
      step++
      if (step >= STEPS) {
        setRolling(null)
        setPicked(final)
        return
      }
      setRolling(pool[Math.floor(Math.random() * pool.length)])
      delay *= SLOWDOWN
      timer.current = setTimeout(tick, delay)
    }
    tick()
  }

  const header = (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.pickTitle}</p>
      <p className="text-xs text-text-secondary/70">{T.cards.pickHint}</p>
    </div>
  )

  if (pool.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {header}
        <EmptyState icon={<IconDice5 className="w-6 h-6" />} title={T.cards.pickEmpty} size="compact" />
      </div>
    )
  }

  const spinning = rolling !== null

  return (
    <div className="flex flex-col gap-4 h-full">
      {header}

      <div className="flex-1 flex flex-col items-center justify-center gap-2 min-h-48 text-center">
        <AnimatePresence mode="wait" initial={false}>
          {picked ? (
            <motion.div
              key={picked.key}
              className="flex flex-col items-center gap-3 min-w-0 w-full"
              initial={reduce ? false : { opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <GameCover source={picked.source} id={picked.id} iconUrl={picked.iconUrl} className="h-32 sm:h-36" />
              <div className="flex flex-col min-w-0 w-full" aria-live="polite">
                <span className="text-sm font-semibold truncate">{picked.title}</span>
                <span className="text-xs text-text-secondary truncate">
                  {picked.subtitle} · {T.categories[picked.status]}
                </span>
              </div>
            </motion.div>
          ) : spinning ? (
            <motion.div key="rolling" className="flex flex-col items-center gap-3 w-full" exit={{ opacity: 0 }}>
              <span className="h-32 sm:h-36 aspect-[3/4] rounded-lg bg-bg-main ring-1 ring-white/10 animate-pulse" />
              <span className="text-sm font-semibold truncate w-full text-text-secondary">{rolling.title}</span>
            </motion.div>
          ) : (
            <motion.span key="idle" aria-hidden="true" className="w-14 h-14 rounded-2xl bg-accent/10 ring-1 ring-accent/20 text-accent flex items-center justify-center" exit={{ opacity: 0 }}>
              <IconDice5 size={30} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-2">
        <button
          onClick={spin}
          disabled={spinning}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-bg-main text-sm font-semibold hover:bg-accent-hover active:scale-[0.98] transition disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {picked ? <IconRefresh size={16} aria-hidden="true" /> : <IconDice5 size={16} aria-hidden="true" />}
          {picked ? T.cards.pickAgain : T.cards.pickButton}
        </button>
        {picked && (
          <Link
            href={picked.href}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-bg-main ring-1 ring-white/10 text-sm font-medium hover:ring-white/25 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {T.cards.pickOpen}
            <IconArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  )
}
