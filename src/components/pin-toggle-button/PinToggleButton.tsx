'use client'

import { useState, type MouseEvent } from 'react'
import { IconPin, IconPinFilled } from '@tabler/icons-react'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import { useLanguage } from '@/context/LanguageContext'

export function PinToggleButton({
  gameId,
  onClick,
  className = '',
}: {
  gameId: number
  onClick?: (e: MouseEvent) => void
  className?: string
}) {
  const { T } = useLanguage()
  const { isPinned, pinGame, unpinGame } = usePinnedGames()
  const [hasError, setHasError] = useState(false)
  const pinned = isPinned(gameId)

  async function handleClick(e: MouseEvent) {
    onClick?.(e)
    try {
      if (pinned) await unpinGame(gameId)
      else await pinGame(gameId)
      setHasError(false)
    } catch {
      setHasError(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        aria-label={pinned ? T.pinnedGames.unpinAria : T.pinnedGames.pinAria}
        aria-pressed={pinned}
        className={`p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 shrink-0 ${
          hasError
            ? 'text-danger'
            : pinned
              ? 'text-accent hover:text-accent/80'
              : 'text-text-secondary/50 hover:text-text-main'
        } ${className}`}
      >
        {pinned ? <IconPinFilled className="w-4 h-4" aria-hidden /> : <IconPin className="w-4 h-4" aria-hidden />}
      </button>
      {hasError && (
        <span role="alert" className="sr-only">
          {T.pinnedGames.error}
        </span>
      )}
    </>
  )
}
