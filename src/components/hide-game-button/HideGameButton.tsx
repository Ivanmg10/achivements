'use client'

import { useState } from 'react'
import type { MouseEvent } from 'react'
import { IconEyeOff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import type { GameSource } from '@/types/steam'
import CommonModal from '@/components/common-modal/CommonModal'

/**
 * The eye next to a game in a status list. It asks first, in a small popup
 * that says where to bring the game back from, then hides it; the list drops
 * it at once and a toast says how it went. Clicks do not reach the card.
 */
export default function HideGameButton({
  source,
  gameId,
  title,
  image,
  className = '',
}: {
  source: GameSource
  gameId: number
  title: string
  /** Kept with the hidden game so preferences can show it as it was. */
  image?: string | null
  className?: string
}) {
  const { T } = useLanguage()
  const { hideGame } = useHiddenGames()
  const [open, setOpen] = useState(false)

  const ask = (e: MouseEvent) => {
    e.stopPropagation()
    setOpen(true)
  }

  const confirm = async () => {
    setOpen(false)
    await hideGame({ source, id: gameId, title, image: image ?? null })
  }

  return (
    <>
      <button
        type="button"
        onClick={ask}
        aria-label={`${T.cards.hideGame}: ${title}`}
        aria-haspopup="dialog"
        className={`p-1.5 rounded-lg text-text-secondary/50 hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 shrink-0 ${className}`}
      >
        <IconEyeOff className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* React carries clicks out of a portal to the card around it: stop them here. */}
      <span className="contents" onClick={(e) => e.stopPropagation()}>
      <CommonModal isOpen={open} onClose={() => setOpen(false)} className="min-h-0">
        <div role="dialog" aria-modal="true" aria-labelledby={`hide-${source}-${gameId}`} className="flex flex-col gap-4">
          <span aria-hidden="true" className="w-12 h-12 rounded-2xl bg-accent/10 ring-1 ring-accent/20 text-accent flex items-center justify-center">
            <IconEyeOff size={22} />
          </span>
          <h2 id={`hide-${source}-${gameId}`} className="text-lg font-semibold">
            {T.cards.hideGameTitle}
          </h2>
          <p className="text-sm text-text-secondary">{T.cards.hideGameText.replace('{title}', title)}</p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl bg-bg-main text-sm text-text-secondary hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {T.cards.cancel}
            </button>
            <button
              type="button"
              onClick={confirm}
              className="px-4 py-2 rounded-xl bg-accent text-bg-main text-sm font-semibold hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {T.cards.hideConfirm}
            </button>
          </div>
        </div>
      </CommonModal>
      </span>
    </>
  )
}
