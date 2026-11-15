import type { ReactNode } from 'react'
import type { GameSource } from '@/types/game'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'

/** A pin for a game no longer in the list (the platform was unlinked): the platform's name, and the pin so it can still be removed. */
export default function PinnedGameMissing({ source, gameId, logo, name }: { source: GameSource; gameId: number; logo: ReactNode; name: string }) {
  return (
    <div className="bg-bg-main rounded-card flex items-center gap-3 px-3 py-3">
      {logo}
      <span className="text-sm text-text-secondary flex-1">{name}</span>
      <PinToggleButton gameId={gameId} source={source} />
    </div>
  )
}
