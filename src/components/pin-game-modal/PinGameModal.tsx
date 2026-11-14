'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import type { GameCandidate } from '@/utils/gameCandidates'
import { gameKey } from '@/utils/gameRef'
import GamePicker from '@/components/game-picker/GamePicker'
import { notify } from '@/lib/notify'

/** Pick games to pin, RA, Steam, PlayStation alike: the game picker with the pins' way of saving. */
export default function PinGameModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const { pins, pinGame } = usePinnedGames()
  const pinnedKeys = useMemo(() => new Set(pins.map((p) => gameKey(p.source, p.id))), [pins])

  /** Pins them in order; the ones not reached after a failure are handed back, to be retried. */
  async function handleConfirm(picked: GameCandidate[]): Promise<GameCandidate[]> {
    for (let i = 0; i < picked.length; i++) {
      try {
        await pinGame(picked[i].id, picked[i].source)
      } catch {
        return picked.slice(i)
      }
    }
    notify.success(T.toast.pinsUpdated)
    return []
  }

  return (
    <GamePicker
      isOpen={isOpen}
      onClose={onClose}
      title={T.pinnedGames.addAria}
      searchLabel={T.pinnedGames.searchPlaceholder}
      excludeKeys={pinnedKeys}
      onConfirm={handleConfirm}
      confirmLabel={(n) => `${T.pinnedGames.confirmPin}${n > 0 ? ` (${n})` : ''}`}
      pickPrompt={T.pinnedGames.pickToPin}
      errorText={T.pinnedGames.error}
    />
  )
}
