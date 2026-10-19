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
      <button
        onClick={() => setOpen(true)}
        aria-label={T.pinnedGames.addAria}
        className="bg-bg-main rounded-xl min-h-20 flex items-center justify-center text-text-secondary hover:text-text-main hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <IconPlus className="w-6 h-6" aria-hidden />
      </button>
      <LazyWhenOpened open={open}>
        <PinGameModal isOpen={open} onClose={() => setOpen(false)} />
      </LazyWhenOpened>
    </>
  )
}
