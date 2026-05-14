'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import Image from 'next/image'
import { IconX, IconSearch, IconTrash } from '@tabler/icons-react'
import { useGamesData } from '@/context/GamesDataContext'
import { useLanguage } from '@/context/LanguageContext'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { GameGroup, GameGroupItem, RetroAchievementsGameCompleted, WantToPlayGame } from '@/types/types'

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

type Props = {
  isOpen: boolean
  onClose: () => void
  group?: GameGroup & { items?: GameGroupItem[] }
  onSave: (data: {
    title: string
    description: string
    icon: string
    is_public: boolean
    initialGames?: RetroAchievementsGameCompleted[]
  }) => Promise<void>
}

function isImageUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://')
}

export default function GroupModal({ isOpen, onClose, group, onSave }: Props) {
  const { T } = useLanguage()
  const { all } = useGamesData()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedGames, setSelectedGames] = useState<RetroAchievementsGameCompleted[]>([])
  const [wantToPlay, setWantToPlay] = useState<WantToPlayGame[]>([])
  const wantFetched = useRef(false)

  const isEditing = !!group

  useEffect(() => {
    if (isOpen) {
      setTitle(group?.title ?? '')
      setDescription(group?.description ?? '')
      setIcon(group?.icon ?? '')
      setIsPublic(group?.is_public ?? false)
      setError('')
      setQuery('')
      setSelectedGames([])
      if (!wantFetched.current) {
        wantFetched.current = true
        fetchWithRetry('/api/getWantPlayGames')
          .then((data) => {
            const results = (data as { Results?: WantToPlayGame[] })?.Results ?? []
            setWantToPlay(results)
          })
          .catch(() => {})
      }
    }
  }, [isOpen, group])

  const uniqueGames = useMemo(() => {
    const seen = new Map<number, RetroAchievementsGameCompleted>()
    for (const g of all) {
      if (!seen.has(g.GameID)) seen.set(g.GameID, g)
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
    return Array.from(seen.values()).sort((a, b) => a.Title.localeCompare(b.Title))
  }, [all, wantToPlay])

  const existingIds = useMemo(
    () => new Set((group?.items ?? []).map((i) => i.game_id)),
    [group],
  )

  const directGameId = useMemo(() => {
    const q = query.trim()
    if (/^\d{3,}$/.test(q)) return parseInt(q)
    const urlMatch = q.match(/retroachievements\.org\/game\/(\d+)/i)
    if (urlMatch) return parseInt(urlMatch[1])
    return null
  }, [query])

  const searchResults = useMemo(() => {
    if (!query.trim() || directGameId) return []
    const q = query.toLowerCase()
    return uniqueGames
      .filter((g) => g.Title.toLowerCase().includes(q) && !existingIds.has(g.GameID) && !selectedGames.find((s) => s.GameID === g.GameID))
      .map((g) => {
        const t = g.Title.toLowerCase()
        const score = t === q ? 3 : t.startsWith(q) ? 2 : t.split(/\s+/).some((w) => w.startsWith(q)) ? 1 : 0
        return { g, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ g }) => g)
  }, [query, uniqueGames, existingIds, selectedGames, directGameId])

  async function addById(id: number) {
    if (existingIds.has(id) || selectedGames.find((s) => s.GameID === id)) return
    try {
      const data = await fetch(`/api/getGameData?gameId=${id}`).then((r) => r.json())
      if (data?.Title) {
        const game: RetroAchievementsGameCompleted = {
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
        addGame(game)
      }
    } catch {
      setError('Game not found')
    }
  }

  function addGame(g: RetroAchievementsGameCompleted) {
    setSelectedGames((prev) => [...prev, g])
    setQuery('')
  }

  function removeSelected(gameId: number) {
    setSelectedGames((prev) => prev.filter((g) => g.GameID !== gameId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError(T.groups.groupTitle); return }
    setSaving(true)
    setError('')
    try {
      await onSave({ title: title.trim(), description, icon, is_public: isPublic, initialGames: isEditing ? undefined : selectedGames })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-16 px-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="bg-bg-card rounded-2xl w-full max-w-md flex flex-col text-text-main shadow-xl max-h-[80vh] overflow-hidden"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <h2 className="text-base font-semibold">
                {isEditing ? T.groups.editGroup : T.groups.newGroup}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main"
                aria-label="Close"
              >
                <IconX className="w-4 h-4" aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 pb-5 overflow-y-auto">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-secondary">{T.groups.groupTitle}</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={T.groups.groupTitlePlaceholder}
                  maxLength={60}
                  className="bg-bg-main rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/70"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-secondary">{T.groups.description}</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={T.groups.descriptionPlaceholder}
                  maxLength={200}
                  className="bg-bg-main rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/70"
                />
              </div>

              {/* Icon */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-text-secondary">{T.groups.icon}</label>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-bg-main flex items-center justify-center shrink-0 overflow-hidden">
                    {icon ? (
                      isImageUrl(icon) ? (
                        <Image src={icon} alt="icon" width={36} height={36} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <span className="text-xl leading-none">{icon}</span>
                      )
                    ) : (
                      <span className="text-xl leading-none">📁</span>
                    )}
                  </div>
                  <input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder={T.groups.iconPlaceholder}
                    className="flex-1 bg-bg-main rounded-lg px-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/70"
                  />
                </div>
              </div>

              {/* Public toggle */}
              <div className="flex items-center justify-between bg-bg-main rounded-lg px-3 py-2.5">
                <span className="text-sm text-text-main">{T.groups.isPublic}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  onClick={() => setIsPublic((p) => !p)}
                  className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-accent/70 ${isPublic ? 'bg-accent' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Game search — only when creating */}
              {!isEditing && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-text-secondary">{T.groups.addGame}</label>

                  {/* Selected games */}
                  {selectedGames.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {selectedGames.map((g) => (
                        <div key={g.GameID} className="flex items-center gap-2 bg-bg-main rounded-lg px-2.5 py-1.5">
                          {g.ImageIcon && (
                            <Image src={`https://retroachievements.org${g.ImageIcon}`} alt={g.Title} width={20} height={20} className="rounded shrink-0" />
                          )}
                          <span className="text-xs flex-1 line-clamp-1">{g.Title}</span>
                          <button
                            type="button"
                            onClick={() => removeSelected(g.GameID)}
                            className="text-text-secondary hover:text-red-400 transition-colors"
                          >
                            <IconTrash className="w-3.5 h-3.5" aria-hidden />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search input */}
                  <div className="relative">
                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" aria-hidden />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={T.groups.searchGames}
                      className="w-full bg-bg-main rounded-lg pl-8 pr-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/70"
                    />
                  </div>

                  {(searchResults.length > 0 || directGameId) && (
                    <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                      {searchResults.map((g) => (
                        <button
                          key={g.GameID}
                          type="button"
                          onClick={() => addGame(g)}
                          className="flex items-center gap-2 bg-bg-main hover:bg-white/5 rounded-lg px-2.5 py-1.5 transition-colors text-left"
                        >
                          {g.ImageIcon && (
                            <Image src={`https://retroachievements.org${g.ImageIcon}`} alt={g.Title} width={20} height={20} className="rounded shrink-0" />
                          )}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs line-clamp-1">{g.Title}</span>
                            <span className="text-[10px] text-text-secondary">{g.ConsoleName}</span>
                          </div>
                        </button>
                      ))}
                      {directGameId && !existingIds.has(directGameId) && !selectedGames.find((s) => s.GameID === directGameId) && (
                        <button
                          type="button"
                          onClick={() => addById(directGameId)}
                          className="flex items-center gap-2 bg-bg-main hover:bg-white/5 rounded-lg px-2.5 py-1.5 transition-colors text-left border border-white/10"
                        >
                          <div className="w-5 h-5 rounded bg-bg-card flex items-center justify-center shrink-0 text-[9px] font-bold text-text-secondary">
                            ID
                          </div>
                          <span className="text-xs text-text-secondary">{T.search.openById} #{directGameId}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg bg-bg-main text-text-secondary text-sm hover:text-text-main transition-colors"
                >
                  {T.groups.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {saving ? '…' : isEditing ? T.groups.save : T.groups.create}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
