'use client'

import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import PinGameModal from '@/components/pin-game-modal/PinGameModal'

export default function PinGameCard() {
  const { T } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={T.pinnedGames.addAria}
        className="bg-bg-main rounded-xl min-h-20 flex items-center justify-center text-text-secondary/50 hover:text-text-main hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <IconPlus className="w-6 h-6" aria-hidden />
      </button>
      <PinGameModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
