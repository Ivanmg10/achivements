'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import Image from 'next/image'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useGamesData } from '@/contexts/GamesDataContext'
import { useLanguage } from '@/context/LanguageContext'

type FavoriteGame = { id: number; title: string; imageIcon: string }

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

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.12, ease: 'easeOut' } },
}

interface Props {
  isOpen: boolean
  current: FavoriteGame | null
  onClose: () => void
  onSave: (game: FavoriteGame | null) => Promise<void>
}

export default function FavoriteGameModal({ isOpen, current, onClose, onSave }: Props) {
  const { T } = useLanguage()
  const { all } = useGamesData()
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    } else {
      setQuery('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const gameIndex = useMemo(() => {
    const seen = new Map<number, { id: number; title: string; imageIcon: string; consoleName: string }>()
    for (const g of all) {
      if (!seen.has(g.GameID)) {
        seen.set(g.GameID, {
          id: g.GameID,
          title: g.Title,
          imageIcon: g.ImageIcon,
          consoleName: g.ConsoleName,
        })
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.title.localeCompare(b.title))
  }, [all])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return gameIndex.slice(0, 8)
    return gameIndex
      .filter((g) => g.title.toLowerCase().includes(q))
      .map((g) => {
        const t = g.title.toLowerCase()
        const score = t === q ? 3 : t.startsWith(q) ? 2 : t.split(/\s+/).some((w) => w.startsWith(q)) ? 1 : 0
        return { g, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map(({ g }) => g)
  }, [query, gameIndex])

  const handleSelect = useCallback(async (game: { id: number; title: string; imageIcon: string }) => {
    setSaving(true)
    await onSave({ id: game.id, title: game.title, imageIcon: game.imageIcon })
    setSaving(false)
    onClose()
  }, [onSave, onClose])

  const handleRemove = useCallback(async () => {
    setSaving(true)
    await onSave(null)
    setSaving(false)
    onClose()
  }, [onSave, onClose])

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
              {/* Input row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
                <IconSearch className="w-5 h-5 text-text-secondary shrink-0" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={T.userData.favoriteGameSearch}
                  className="flex-1 bg-transparent text-text-main text-base outline-none placeholder:text-text-secondary"
                  aria-label={T.userData.favoriteGameSearch}
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

              {/* Current selection row */}
              {current && (
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 bg-accent/5">
                  {current.imageIcon ? (
                    <Image
                      src={`https://retroachievements.org${current.imageIcon}`}
                      alt={current.title}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded object-cover shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="w-7 h-7 rounded bg-white/10 shrink-0" />
                  )}
                  <span className="flex-1 text-sm font-medium text-accent truncate">{current.title}</span>
                  <button
                    onClick={handleRemove}
                    disabled={saving}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    {T.userData.favoriteGameRemove}
                  </button>
                </div>
              )}

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <div className="py-8 text-center text-text-secondary text-sm">
                    {query ? 'No results' : 'No games in library'}
                  </div>
                ) : (
                  <motion.ul
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
                  >
                    {results.map((game) => (
                      <motion.li key={game.id} variants={rowVariants}>
                        <button
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-main transition-colors text-left cursor-pointer disabled:opacity-50 ${
                            current?.id === game.id ? 'bg-accent/8' : ''
                          }`}
                          onClick={() => handleSelect(game)}
                          disabled={saving}
                        >
                          {game.imageIcon ? (
                            <Image
                              src={`https://retroachievements.org${game.imageIcon}`}
                              alt={game.title}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded object-cover shrink-0"
                              unoptimized
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-white/10 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-main truncate">{game.title}</p>
                            <p className="text-xs text-text-secondary truncate">{game.consoleName}</p>
                          </div>
                          {current?.id === game.id && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent whitespace-nowrap shrink-0">
                              ★
                            </span>
                          )}
                        </button>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </div>

              {saving && (
                <div className="px-4 py-2 border-t border-white/5 text-xs text-text-secondary text-center">
                  Saving…
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
