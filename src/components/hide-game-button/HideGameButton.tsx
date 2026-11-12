'use client'

import { useState } from 'react'
import type { MouseEvent } from 'react'
import { IconEyeOff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { useSubject } from '@/context/SubjectContext'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { GameSource } from '@/types/game'

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
  const subject = useSubject()
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

  // Hiding tidies the viewer's own lists: not on someone else's page.
  if (subject) return null

  return (
    <>
      <button
        type="button"
        onClick={ask}
        aria-label={`${T.cards.hideGame}: ${title}`}
        aria-haspopup="dialog"
        className={`p-1.5 rounded-chip text-text-secondary hover:text-text-main transition-colors focus-ring shrink-0 ${className}`}
      >
        <IconEyeOff className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* React carries clicks out of a portal to the card around it: stop them here. */}
      <span className="contents" onClick={(e) => e.stopPropagation()}>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        icon={<IconEyeOff size={20} />}
        title={T.cards.hideGameTitle}
        hint={T.cards.hideGameText.replace('{title}', title)}
        footer={
          <>
            <Button type="button" onClick={() => setOpen(false)} variant="quiet">
              {T.cards.cancel}
            </Button>
            <Button type="button" onClick={confirm}>
              {T.cards.hideConfirm}
            </Button>
          </>
        }
      />
      </span>
    </>
  )
}
