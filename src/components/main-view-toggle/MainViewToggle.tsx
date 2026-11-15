'use client'

import { useEffect, useRef } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useMainView } from '@/context/MainViewContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import Tabs from '@/components/ui/Tabs'

type View = 'recent' | 'pinned'

// Each view renders its own header, so the arrow keys' focus has to survive the remount.
let focusAfterSwitch = false

/**
 * The home's left card title, which is also its switch: "Recently played" and
 * "Pinned games" side by side as the library's title-sized tabs (the mark in
 * front of the one on); pinned carries its count.
 */
export function MainViewToggle() {
  const { T } = useLanguage()
  const { view, setView } = useMainView()
  const { pins } = usePinnedGames()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!focusAfterSwitch) return
    focusAfterSwitch = false
    ref.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus()
  }, [])

  function go(id: View) {
    if (id === view) return
    focusAfterSwitch = document.activeElement?.getAttribute('role') === 'tab'
    setView(id)
  }

  const count = pins.length > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-ink/10 text-text-main">{pins.length}</span>

  return (
    <div ref={ref} className="min-w-0 flex-1">
      <Tabs<View>
        id="main-view"
        aria-label={T.libraryFilters.viewLabel}
        size="lg"
        panels={false}
        value={view}
        onChange={go}
        tabs={[
          { value: 'recent', label: T.cards.recentlyPlayed },
          { value: 'pinned', label: T.pinnedGames.title, count: count || undefined },
        ]}
      />
    </div>
  )
}
