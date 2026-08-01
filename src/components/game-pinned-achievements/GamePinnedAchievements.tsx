'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { IconPlus, IconStarFilled } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievement } from '@/types/types'
import { PinAchievementModal } from '@/components/pin-achievement-modal/PinAchievementModal'

type PinnedRow = { achievement_id: number; snapshot: RetroAchievement }

export function GamePinnedAchievements({
  gameId,
  gameTitle,
  numDistinctPlayers,
  achievements,
}: {
  gameId: number
  gameTitle: string
  numDistinctPlayers: number
  achievements: RetroAchievement[]
}) {
  const { T } = useLanguage()
  const [pinned, setPinned] = useState<PinnedRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(() => {
    setIsLoading(true)
    fetch(`/api/favorites?gameId=${gameId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load pinned achievements')
        return res.json()
      })
      .then((rows: PinnedRow[]) => {
        setPinned(rows)
        setHasError(false)
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false))
  }, [gameId])

  useEffect(() => {
    load()
  }, [load])

  async function handleUnpin(achievementId: number) {
    const prev = pinned
    setPinned((p) => p.filter((row) => row.achievement_id !== achievementId))
    try {
      const res = await fetch(`/api/favorites?achievementId=${achievementId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to unpin achievement')
    } catch {
      setPinned(prev)
      setHasError(true)
    }
  }

  const unearned = achievements.filter((a) => !a.DateEarned && !a.DateEarnedHardcore)

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-xs text-text-secondary">{T.gameExpanded.pinnedAchievements}</p>

      {hasError && (
        <p role="alert" className="text-xs text-danger">
          {T.gameExpanded.loadError}
        </p>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-2.5 w-28 rounded bg-white/10" />
                <div className="h-2 w-20 rounded bg-white/10" />
              </div>
              <div className="w-6 h-4 rounded bg-white/10 shrink-0" />
            </div>
          ))}
        </div>
      ) : pinned.length === 0 ? (
        unearned.length > 0 ? (
          <button
            onClick={() => setModalOpen(true)}
            aria-label={T.gameExpanded.pinAchievementAria}
            className="w-full flex-1 rounded-lg border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-1.5 text-text-secondary/50 hover:text-text-main hover:border-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconPlus className="w-6 h-6" aria-hidden />
            <span className="text-xs">{T.gameExpanded.pinAchievementAria}</span>
          </button>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-text-secondary/50 italic text-center">{T.gameExpanded.noUnearned}</p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {pinned.map((row) => {
            const earned = !!row.snapshot.DateEarned
            return (
              <div
                key={row.achievement_id}
                className="group flex items-center gap-2 hover:bg-bg-main/60 rounded-lg px-2 py-1.5 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {row.snapshot.BadgeName ? (
                    <Image
                      src={`https://media.retroachievements.org/Badge/${row.snapshot.BadgeName}.png`}
                      alt={row.snapshot.Title}
                      width={36}
                      height={36}
                      className={`w-9 h-9 rounded-lg object-cover shrink-0 ${earned ? '' : 'grayscale opacity-50'}`}
                      unoptimized
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{row.snapshot.Title}</p>
                    <p className="text-[10px] text-text-secondary truncate">{row.snapshot.Description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-semibold tabular-nums">{row.snapshot.Points}</p>
                    <p className="text-[10px] text-text-secondary">pts</p>
                  </div>
                  <button
                    onClick={() => handleUnpin(row.achievement_id)}
                    aria-label={`${T.gameExpanded.unpinAria} ${row.snapshot.Title}`}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
                  >
                    <IconStarFilled className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </div>
            )
          })}
          {unearned.length > 0 && (
            <button
              onClick={() => setModalOpen(true)}
              aria-label={T.gameExpanded.pinAchievementAria}
              className="w-full rounded-lg border-2 border-dashed border-white/15 flex items-center justify-center gap-1.5 py-2 text-text-secondary/50 hover:text-text-main hover:border-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <IconPlus className="w-4 h-4" aria-hidden />
              <span className="text-xs">{T.gameExpanded.pinAchievementAria}</span>
            </button>
          )}
        </div>
      )}

      <PinAchievementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        achievements={unearned}
        gameId={gameId}
        gameTitle={gameTitle}
        numDistinctPlayers={numDistinctPlayers}
        onPinned={load}
      />
    </div>
  )
}
