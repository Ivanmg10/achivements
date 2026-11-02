'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievement } from '@/types/types'
import { notify } from '@/lib/notify'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import Modal from '@/components/ui/Modal'

export function PinAchievementModal({
  isOpen,
  onClose,
  achievements,
  gameId,
  gameTitle,
  numDistinctPlayers,
  onPinned,
}: {
  isOpen: boolean
  onClose: () => void
  achievements: RetroAchievement[]
  gameId: number
  gameTitle: string
  numDistinctPlayers: number
  onPinned: () => void
}) {
  const { T } = useLanguage()
  const [pinningId, setPinningId] = useState<number | null>(null)
  const [error, setError] = useState(false)

  // Opening starts it over; state, so while rendering.
  useWhenChanged([isOpen], () => {
    if (isOpen) {
      setError(false)
      setPinningId(null)
    }
  })

  async function handlePin(achievement: RetroAchievement) {
    setPinningId(achievement.ID)
    setError(false)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievement, gameId, gameTitle, numDistinctPlayers }),
      })
      if (!res.ok) throw new Error('Failed to pin achievement')
      onPinned()
      notify.success(T.toast.achievementsUpdated)
      onClose()
    } catch {
      setError(true)
      setPinningId(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title={T.gameExpanded.pinAchievementModalTitle} className="gap-3">
      {error && (
        <p role="alert" className="text-xs text-danger">
          {T.gameExpanded.loadError}
        </p>
      )}

      <div className="-mx-3 max-h-[60vh] overflow-y-auto">
        {achievements.length === 0 ? (
          <p className="text-text-secondary text-xs text-center py-6">
            {T.gameExpanded.noUnearned}
          </p>
        ) : (
          achievements.map((a) => (
            <button
              key={a.ID}
              onClick={() => handlePin(a)}
              disabled={pinningId !== null}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-box transition-colors text-left hover:bg-bg-main disabled:opacity-50"
            >
              {a.BadgeName ? (
                <Image
                  src={`https://media.retroachievements.org/Badge/${a.BadgeName}.png`}
                  alt={a.Title}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-box object-cover grayscale opacity-70 shrink-0"
                  unoptimized
                />
              ) : (
                <div className="w-9 h-9 rounded-box bg-ink/10 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main truncate">{a.Title}</p>
                <p className="text-xs text-text-secondary truncate">{a.Points} pts</p>
              </div>
              {pinningId === a.ID && <span className="text-xs text-text-secondary">…</span>}
            </button>
          ))
        )}
      </div>
    </Modal>
  )
}
