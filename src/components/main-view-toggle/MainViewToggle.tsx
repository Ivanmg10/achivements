'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { useMainView } from '@/context/MainViewContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'

type View = 'recent' | 'pinned'

const TAB_BASE = 'relative pb-1.5 text-xl tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded-box-sm'

// Each view renders its own header, so the arrow keys' focus has to survive the remount.
let focusAfterSwitch = false

/**
 * The home's left card title, which is also its switch: "Recently played" and
 * "Pinned games" side by side as tabs. The selected one is bold, bright and
 * underlined (not colour alone); pinned carries its count.
 */
export function MainViewToggle() {
  const { T } = useLanguage()
  const { view, setView } = useMainView()
  const { pins } = usePinnedGames()
  const selectedRef = useRef<HTMLButtonElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!focusAfterSwitch) return
    focusAfterSwitch = false
    selectedRef.current?.focus()
  }, [])

  function go(id: View) {
    if (id !== view) setView(id)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    focusAfterSwitch = true
    go(view === 'recent' ? 'pinned' : 'recent')
  }

  function tab(id: View, label: string, extra?: React.ReactNode) {
    const selected = view === id
    return (
      <button
        role="tab"
        ref={selected ? selectedRef : undefined}
        aria-selected={selected}
        tabIndex={selected ? 0 : -1}
        onClick={() => go(id)}
        className={`${TAB_BASE} flex items-center gap-2 ${
          selected ? 'font-bold text-text-main' : 'font-semibold text-text-secondary hover:text-text-main'
        }`}
      >
        {label}
        {extra}
        {selected && (
          <motion.span
            layoutId="main-view-tab"
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }}
            className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-accent"
            aria-hidden="true"
          />
        )}
      </button>
    )
  }

  return (
    <div role="tablist" onKeyDown={handleKeyDown} className="flex flex-wrap items-end gap-x-6 gap-y-1 min-w-0 flex-1">
      {tab('recent', T.cards.recentlyPlayed)}
      {tab(
        'pinned',
        T.pinnedGames.title,
        pins.length > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-ink/10 text-text-main">{pins.length}</span>
        ),
      )}
    </div>
  )
}
