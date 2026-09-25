'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import Image from 'next/image'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { candidateIconUrl, searchCandidates } from '@/utils/gameCandidates'
import GamePickerRow from '@/components/game-picker/game-picker-row/GamePickerRow'
import type { GameSource } from '@/types/steam'

export type FavoriteGame = { id: number; title: string; imageIcon: string }

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

const contentVariants: Variants = {
  hidden: { opacity: 0, y: -14, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15, ease: 'easeIn' } },
}

const SUGGESTIONS = 8

/**
 * Picks the user's favourite game on one platform, from the games the app
 * already knows about. An empty box suggests a few; typing searches them all.
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
  const candidates = useGameCandidates(isOpen)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setError(false)
      return
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const ofPlatform = useMemo(() => candidates.filter((c) => c.source === source), [candidates, source])

  const results = useMemo(() => {
    if (!query.trim()) {
      return [...ofPlatform].sort((a, b) => a.title.localeCompare(b.title)).slice(0, SUGGESTIONS)
    }
    return searchCandidates(ofPlatform, query, new Set(), 12)
  }, [ofPlatform, query])

  async function save(game: FavoriteGame | null) {
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
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-full max-w-xl px-4">
            <motion.div
              className="bg-bg-card rounded-2xl shadow-2xl overflow-hidden border border-white/5"
              variants={contentVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
                <IconSearch className="w-5 h-5 text-text-secondary shrink-0" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={T.userData.favoriteGameSearch}
                  aria-label={T.userData.favoriteGameSearch}
                  className="flex-1 bg-transparent text-text-main text-base outline-none placeholder:text-text-secondary"
                  disabled={saving}
                />
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-1 rounded-lg text-text-secondary hover:text-text-main transition-colors"
                >
                  <IconX className="w-4 h-4" aria-hidden />
                </button>
              </div>

              {current && (
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 bg-accent/5">
                  {current.imageIcon ? (
                    <Image
                      src={candidateIconUrl({ source, imageRef: current.imageIcon })}
                      alt=""
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded object-cover shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="w-7 h-7 rounded bg-white/10 shrink-0" aria-hidden="true" />
                  )}
                  <span className="flex-1 text-sm font-medium text-accent line-clamp-1">{current.title}</span>
                  <button
                    onClick={() => save(null)}
                    disabled={saving}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    {T.userData.favoriteGameRemove}
                  </button>
                </div>
              )}

              {error && (
                <p role="alert" className="px-4 py-2 text-xs text-red-400 border-b border-white/5">
                  {T.userData.favoriteGameError}
                </p>
              )}

              <div className="max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <p className="py-8 text-center text-text-secondary text-sm">
                    {query ? T.userData.favoriteGameNoResults : T.userData.favoriteGameNoGames}
                  </p>
                ) : (
                  results.map((c) => (
                    <GamePickerRow
                      key={c.key}
                      candidate={c}
                      selected={current?.id === c.id}
                      onToggle={() =>
                        save(
                          current?.id === c.id
                            ? null
                            : { id: c.id, title: c.title, imageIcon: c.imageRef },
                        )
                      }
                    />
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
