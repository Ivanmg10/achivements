'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { IconPlus } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'

// Downloaded the first time it is opened, not with the page.
const PinGameModal = dynamic(() => import('@/components/pin-game-modal/PinGameModal'), { loading: () => null })

export default function PinGameCard() {
  const { T } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* A dummy row, shaped like the pinned ones around it: where the next game goes. */}
      <button
        onClick={() => setOpen(true)}
        className="group flex-1 min-h-20 flex items-center gap-4 p-3 rounded-tile border border-dashed border-ink/15 text-left text-text-secondary hover:text-text-main hover:border-accent/50 hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <span className="w-14 h-14 shrink-0 rounded-lg bg-ink/5 flex items-center justify-center group-hover:text-accent transition-colors">
          <IconPlus className="w-6 h-6" aria-hidden />
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-2">
          <span className="font-bold">{T.pinnedGames.addAria}</span>
          <span className="h-1 rounded-full bg-ink/10" aria-hidden />
          <span className="h-2 w-1/3 rounded-full bg-ink/5" aria-hidden />
        </span>
      </button>
      <LazyWhenOpened open={open}>
        <PinGameModal isOpen={open} onClose={() => setOpen(false)} />
      </LazyWhenOpened>
    </>
  )
}
