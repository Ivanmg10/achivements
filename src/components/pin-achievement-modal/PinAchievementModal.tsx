'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievement } from '@/types/types'

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
const spotlightVariants: Variants = {
  hidden: { opacity: 0, y: -14, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15 } },
}

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

  useEffect(() => {
    if (!isOpen) return
    setError(false)
    setPinningId(null)
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

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
      onClose()
    } catch {
      setError(true)
      setPinningId(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
            <motion.div
              className="bg-bg-card rounded-2xl shadow-2xl border border-white/5 flex flex-col overflow-hidden max-h-[70vh]"
              variants={spotlightVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 shrink-0">
                <p className="text-sm font-semibold text-text-main">
                  {T.gameExpanded.pinAchievementModalTitle}
                </p>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-text-secondary hover:text-text-main transition-colors shrink-0"
                  aria-label="Close"
                >
                  <IconX className="w-4 h-4" aria-hidden />
                </button>
              </div>

              {error && (
                <p role="alert" className="text-xs text-danger px-4 pt-2">
                  {T.gameExpanded.loadError}
                </p>
              )}

              <div className="overflow-y-auto">
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
                      className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left hover:bg-bg-main disabled:opacity-50"
                    >
                      {a.BadgeName ? (
                        <Image
                          src={`https://media.retroachievements.org/Badge/${a.BadgeName}.png`}
                          alt={a.Title}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-lg object-cover grayscale opacity-70 shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
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
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
