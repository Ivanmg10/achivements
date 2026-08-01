'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  IconSearch,
  IconX,
  IconCheck,
} from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGamesData } from '@/context/GamesDataContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import { useRecentlyPlayedGames } from '@/hooks/useRecentlyPlayedGames'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'

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

export default function PinGameModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { T } = useLanguage()
  const { all } = useGamesData()
  const { pinnedIds, pinGame } = usePinnedGames()
  const recentlyPlayedData = useRecentlyPlayedGames()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Map<number, RetroAchievementsGameCompleted>>(new Map())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [wantToPlay, setWantToPlay] = useState<WantToPlayGame[]>([])
  const wantFetched = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const existingIds = useMemo(() => new Set(pinnedIds), [pinnedIds])

  useEffect(() => {
    if (!isOpen) return
    setTimeout(() => inputRef.current?.focus(), 50)
    setQuery('')
    setSelected(new Map())
    setError(false)
    if (!wantFetched.current) {
      wantFetched.current = true
      fetchWithRetry('/api/getWantPlayGames')
        .then((data) => {
          setWantToPlay((data as { Results?: WantToPlayGame[] })?.Results ?? [])
        })
        .catch(() => {})
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const uniqueGames = useMemo(() => {
    const seen = new Map<number, RetroAchievementsGameCompleted>()
    for (const g of all) {
      if (!seen.has(g.GameID)) seen.set(g.GameID, g)
    }
    for (const g of recentlyPlayedData) {
      if (!seen.has(g.GameID)) {
        seen.set(g.GameID, {
          GameID: g.GameID,
          Title: g.Title,
          ImageIcon: g.ImageIcon,
          ConsoleID: 0,
          ConsoleName: g.ConsoleName,
          MaxPossible: g.NumPossibleAchievements,
          NumAwarded: g.NumAchieved,
          PctWon: '0',
          HardcoreMode: '0',
        })
      }
    }
    for (const g of wantToPlay) {
      if (!seen.has(g.ID)) {
        seen.set(g.ID, {
          GameID: g.ID,
          Title: g.Title,
          ImageIcon: g.ImageIcon,
          ConsoleID: g.ConsoleID,
          ConsoleName: g.ConsoleName,
          MaxPossible: g.AchievementsPublished,
          NumAwarded: 0,
          PctWon: '0',
          HardcoreMode: '0',
        })
      }
    }
    return Array.from(seen.values())
  }, [all, recentlyPlayedData, wantToPlay])

  const directGameId = useMemo(() => {
    const q = query.trim()
    if (/^\d{3,}$/.test(q)) return parseInt(q)
    const m = q.match(/retroachievements\.org\/game\/(\d+)/i)
    return m ? parseInt(m[1]) : null
  }, [query])

  const results = useMemo(() => {
    if (!query.trim() || directGameId) return []
    const q = query.toLowerCase()
    return uniqueGames
      .filter((g) => g.Title.toLowerCase().includes(q) && !existingIds.has(g.GameID))
      .map((g) => {
        const t = g.Title.toLowerCase()
        const score =
          t === q ? 3 : t.startsWith(q) ? 2 : t.split(/\s+/).some((w) => w.startsWith(q)) ? 1 : 0
        return { g, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ g }) => g)
  }, [query, uniqueGames, existingIds, directGameId])

  function toggleGame(g: RetroAchievementsGameCompleted) {
    setSelected((prev) => {
      const next = new Map(prev)
      next.has(g.GameID) ? next.delete(g.GameID) : next.set(g.GameID, g)
      return next
    })
  }

  async function addDirectById(id: number) {
    try {
      const data = await fetch(`/api/getGameData?gameId=${id}`).then((r) => r.json())
      if (data?.Title) {
        const g: RetroAchievementsGameCompleted = {
          GameID: id,
          Title: data.Title,
          ImageIcon: data.ImageIcon ?? '',
          ConsoleID: data.ConsoleID ?? 0,
          ConsoleName: data.ConsoleName ?? '',
          MaxPossible: data.NumAchievements ?? 0,
          NumAwarded: 0,
          PctWon: '0',
          HardcoreMode: '0',
        }
        setSelected((prev) => {
          const next = new Map(prev)
          next.has(id) ? next.delete(id) : next.set(id, g)
          return next
        })
        setQuery('')
      }
    } catch {
      /* the empty result list already reflects that nothing was found */
    }
  }

  async function handleConfirm() {
    if (selected.size === 0) return
    setSaving(true)
    setError(false)
    try {
      for (const g of selected.values()) {
        await pinGame(g.GameID)
      }
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
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
            <motion.div
              className="bg-bg-card rounded-2xl shadow-2xl border border-white/5 flex flex-col overflow-hidden"
              variants={spotlightVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 shrink-0">
                <IconSearch className="w-5 h-5 text-text-secondary shrink-0" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={T.pinnedGames.searchPlaceholder}
                  className="flex-1 bg-transparent text-text-main text-base outline-none placeholder:text-text-secondary"
                />
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-text-secondary hover:text-text-main transition-colors shrink-0"
                  aria-label="Close"
                >
                  <IconX className="w-4 h-4" aria-hidden />
                </button>
              </div>

              {(results.length > 0 || directGameId) && (
                <div className="max-h-80 overflow-y-auto">
                  {results.map((g) => {
                    const isSel = selected.has(g.GameID)
                    return (
                      <button
                        key={g.GameID}
                        onClick={() => toggleGame(g)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${isSel ? 'bg-accent/10' : 'hover:bg-bg-main'}`}
                      >
                        {g.ImageIcon && (
                          <Image
                            src={`https://retroachievements.org${g.ImageIcon}`}
                            alt={g.Title}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded object-cover shrink-0"
                            unoptimized
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-main truncate">{g.Title}</p>
                          <p className="text-xs text-text-secondary truncate">{g.ConsoleName}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${isSel ? 'bg-accent border-accent' : 'border-white/20'}`}
                        >
                          {isSel && <IconCheck className="w-3 h-3 text-bg-main" aria-hidden />}
                        </div>
                      </button>
                    )
                  })}
                  {directGameId && !existingIds.has(directGameId) && (
                    <button
                      onClick={() => addDirectById(directGameId)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-t border-white/5 ${selected.has(directGameId) ? 'bg-accent/10' : 'hover:bg-bg-main'}`}
                    >
                      <div className="w-8 h-8 rounded bg-bg-main flex items-center justify-center shrink-0 text-xs font-bold text-text-secondary">
                        ID
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-main">
                          {T.search.openById} #{directGameId}
                        </p>
                        <p className="text-xs text-text-secondary">Game ID</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${selected.has(directGameId) ? 'bg-accent border-accent' : 'border-white/20'}`}
                      >
                        {selected.has(directGameId) && (
                          <IconCheck className="w-3 h-3 text-bg-main" aria-hidden />
                        )}
                      </div>
                    </button>
                  )}
                </div>
              )}

              {selected.size > 0 && (
                <div className="border-t border-white/5 px-4 py-3 flex flex-col gap-3 shrink-0">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(selected.values()).map((g) => (
                      <span
                        key={g.GameID}
                        className="flex items-center gap-1.5 bg-accent/15 text-accent text-xs px-2.5 py-1 rounded-full"
                      >
                        {g.ImageIcon && (
                          <Image
                            src={`https://retroachievements.org${g.ImageIcon}`}
                            alt={g.Title}
                            width={14}
                            height={14}
                            className="rounded shrink-0"
                            unoptimized
                          />
                        )}
                        <span className="truncate max-w-32">{g.Title}</span>
                        <button
                          onClick={() => toggleGame(g)}
                          className="text-accent/60 hover:text-accent transition-colors ml-0.5"
                          aria-label={`Remove ${g.Title}`}
                        >
                          <IconX className="w-3 h-3" aria-hidden />
                        </button>
                      </span>
                    ))}
                  </div>
                  {error && (
                    <p role="alert" className="text-xs text-danger">
                      {T.pinnedGames.error}
                    </p>
                  )}
                  <button
                    onClick={handleConfirm}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? '…' : `${T.pinnedGames.confirmPin} (${selected.size})`}
                  </button>
                </div>
              )}

              {!query.trim() && selected.size === 0 && (
                <p className="text-text-secondary text-xs text-center py-6">
                  {T.pinnedGames.searchPlaceholder}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
