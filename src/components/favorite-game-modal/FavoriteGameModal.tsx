'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { candidateIconUrl, type GameCandidate } from '@/utils/gameCandidates'
import { gameKey } from '@/utils/gameRef'
import GamePicker from '@/components/game-picker/GamePicker'
import Button from '@/components/ui/Button'
import type { GameSource } from '@/types/game'

export type FavoriteGame = { id: number; title: string; imageIcon: string }

/**
 * Picks the user's favourite game on one platform: the game picker with a single choice, saved at once. The
 * current one is shown on top with a way to remove it; picking it again clears it.
 */
export default function FavoriteGameModal({
  isOpen,
  source,
  current,
  onClose,
  onSave,
}: {
  isOpen: boolean
  source: GameSource
  current: FavoriteGame | null
  onClose: () => void
  onSave: (game: FavoriteGame | null) => Promise<void>
}) {
  const { T } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  // Closing starts it over; state, so while rendering.
  useWhenChanged([isOpen], () => {
    if (!isOpen) setError(false)
  })

  const marked = useMemo(() => new Set(current ? [gameKey(source, current.id)] : []), [current, source])

  async function save(game: FavoriteGame | null) {
    if (saving) return
    setSaving(true)
    setError(false)
    try {
      await onSave(game)
      setSaving(false)
      onClose()
    } catch {
      setSaving(false)
      setError(true)
    }
  }

  const choose = (c: GameCandidate) => save(current?.id === c.id ? null : { id: c.id, title: c.title, imageIcon: c.imageRef })

  return (
    <GamePicker
      isOpen={isOpen}
      onClose={onClose}
      title={T.userData.favoriteGame}
      searchLabel={T.userData.favoriteGameSearch}
      onlySource={source}
      onPick={choose}
      marked={marked}
      busy={saving}
      error={error ? T.userData.favoriteGameError : undefined}
      top={
        current && (
          <div className="flex items-center gap-3 rounded-tile bg-accent/[0.08] px-3 py-2.5">
            {current.imageIcon ? (
              <Image
                src={candidateIconUrl({ source, imageRef: current.imageIcon })}
                alt=""
                width={28}
                height={28}
                className="w-7 h-7 rounded-box-sm object-cover shrink-0"
                unoptimized
              />
            ) : (
              <div className="w-7 h-7 rounded-box-sm bg-ink/10 shrink-0" aria-hidden="true" />
            )}
            <span className="flex-1 min-w-0 text-sm font-medium text-accent line-clamp-1">{current.title}</span>
            <Button variant="danger" size="sm" onClick={() => save(null)} disabled={saving}>
              {T.userData.favoriteGameRemove}
            </Button>
          </div>
        )
      }
    />
  )
}
