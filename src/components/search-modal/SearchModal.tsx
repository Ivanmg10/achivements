'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { IconSearch, IconX, IconUser } from '@tabler/icons-react'
import { useGamesData } from '@/context/GamesDataContext'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievementsGameCompleted, RetroAchievementsUserProfile, WantToPlayGame } from '@/types/types'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

type GameStatus = 'completed-hc' | 'completed-sc' | 'in-progress' | 'want-to-play'

type SearchResult = {
  id: number
  title: string
  icon: string
  consoleName: string
  status: GameStatus
}

const STATUS_PRIORITY: Record<GameStatus, number> = {
  'completed-hc': 4,
  'completed-sc': 3,
  'in-progress': 2,
  'want-to-play': 1,
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const STATUS_CLASSES: Record<GameStatus, string> = {
  'completed-hc': 'bg-amber-500/20 text-amber-400',
  'completed-sc': 'bg-green-500/20 text-green-400',
  'in-progress': 'bg-blue-500/20 text-blue-400',
  'want-to-play': 'bg-purple-500/20 text-purple-400',
}

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

const resultVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' } },
}

function buildIndex(
  completed: RetroAchievementsGameCompleted[],
  wantToPlay: WantToPlayGame[],
): SearchResult[] {
  const map = new Map<number, SearchResult>()

  for (const g of completed) {
    const pct = parseFloat(g.PctWon)
    let status: GameStatus
    if (g.HardcoreMode === '1' && pct >= 1) status = 'completed-hc'
    else if (g.HardcoreMode === '0' && pct >= 1) status = 'completed-sc'
    else status = 'in-progress'

    const existing = map.get(g.GameID)
    if (!existing || STATUS_PRIORITY[status] > STATUS_PRIORITY[existing.status]) {
      map.set(g.GameID, {
        id: g.GameID,
        title: g.Title,
        icon: g.ImageIcon,
        consoleName: g.ConsoleName,
        status,
      })
    }
  }

  for (const g of wantToPlay) {
    const id = g.ID ?? g.GameID!
    if (!map.has(id)) {
      map.set(id, {
        id,
        title: g.Title,
        icon: g.ImageIcon,
        consoleName: g.ConsoleName,
        status: 'want-to-play',
      })
    }
  }

  return Array.from(map.values())
}

type SearchTab = 'games' | 'users'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { T } = useLanguage()
  const router = useRouter()
  const { all: completedGames } = useGamesData()
  const [tab, setTab] = useState<SearchTab>('games')
  const [query, setQuery] = useState('')
  const [wantToPlay, setWantToPlay] = useState<WantToPlayGame[]>([])
  const [userResult, setUserResult] = useState<RetroAchievementsUserProfile | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState(false)
  const wantFetched = useRef(false)
  const userDebounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen || wantFetched.current) return
    wantFetched.current = true
    fetchWithRetry('/api/getWantPlayGames')
      .then((data) => {
        const results = (data as { Results?: WantToPlayGame[] })?.Results ?? []
        setWantToPlay(results)
      })
      .catch(() => {})
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    } else {
      setQuery('')
      setTab('games')
      setUserResult(null)
      setUserError(false)
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

  useEffect(() => {
    if (tab !== 'users') return
    const q = query.trim()
    setUserResult(null)
    setUserError(false)
    // RA API requires exact username — spaces are invalid, min 3 chars
    if (q.length < 3 || q.includes(' ')) return
    clearTimeout(userDebounce.current)
    userDebounce.current = setTimeout(() => {
      setUserLoading(true)
      fetch(`/api/public/user/search?u=${encodeURIComponent(q)}`)
        .then((r) => {
          if (!r.ok) throw new Error('Not found')
          return r.json()
        })
        .then((data) => {
          setUserResult(data?.User ? data : null)
          setUserError(!data?.User)
          setUserLoading(false)
        })
        .catch(() => {
          setUserResult(null)
          setUserError(true)
          setUserLoading(false)
        })
    }, 400)
    return () => clearTimeout(userDebounce.current)
  }, [query, tab])

  const allGames = useMemo(
    () => buildIndex(completedGames, wantToPlay),
    [completedGames, wantToPlay],
  )

  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return []
    return allGames
      .filter((g) => normalize(g.title).includes(q))
      .map((g) => {
        const t = normalize(g.title)
        const score = t === q ? 3 : t.startsWith(q) ? 2 : t.split(/\s+/).some((w) => w.startsWith(q)) ? 1 : 0
        return { g, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ g }) => g)
  }, [query, allGames])

  const directGameId = useMemo(() => {
    const q = query.trim()
    if (/^\d{3,}$/.test(q)) return parseInt(q)
    const urlMatch = q.match(/retroachievements\.org\/game\/(\d+)/i)
    if (urlMatch) return parseInt(urlMatch[1])
    return null
  }, [query])

  const handleSelect = useCallback(
    (id: number) => {
      router.push(`/gameInfo/${id}`)
      onClose()
    },
    [router, onClose],
  )

  const statusLabel = useCallback(
    (status: GameStatus) => {
      const map: Record<GameStatus, string> = {
        'completed-hc': T.search.completedHC,
        'completed-sc': T.search.completedSC,
        'in-progress': T.search.inProgress,
        'want-to-play': T.search.wantToPlay,
      }
      return map[status]
    },
    [T],
  )

  const placeholder = tab === 'users' ? T.publicProfile.searchUsersPlaceholder : T.search.placeholder

  const handleUserSelect = useCallback(
    (username: string) => {
      router.push(`/user/${encodeURIComponent(username)}`)
      onClose()
    },
    [router, onClose],
  )

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
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
            <motion.div
              className="bg-bg-card rounded-2xl shadow-2xl overflow-hidden border border-white/5"
              variants={contentVariants}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
                {tab === 'users'
                  ? <IconUser className="w-5 h-5 text-text-secondary shrink-0" aria-hidden />
                  : <IconSearch className="w-5 h-5 text-text-secondary shrink-0" aria-hidden />
                }
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-text-main text-base outline-none placeholder:text-text-secondary"
                  aria-label={placeholder}
                />
                <button
                  onClick={onClose}
                  aria-label="Close search"
                  className="p-1 rounded-lg text-text-secondary hover:text-text-main transition-colors"
                >
                  <IconX className="w-4 h-4" aria-hidden />
                </button>
              </div>

              {/* Tab toggle */}
              <div className="flex border-b border-white/5 px-4 gap-4">
                {(['games', 'users'] as SearchTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setQuery('') }}
                    className={`py-2 text-xs font-medium border-b-2 transition-colors ${tab === t ? 'border-accent text-text-main' : 'border-transparent text-text-secondary hover:text-text-main'}`}
                  >
                    {t === 'games' ? T.publicProfile.gamesTab : T.publicProfile.userTab}
                  </button>
                ))}
              </div>

              {/* Results — Games */}
              {tab === 'games' && (
                query.trim() ? (
                  <div className="max-h-105 overflow-y-auto">
                    {results.length === 0 && !directGameId ? (
                      <div className="flex flex-col items-center gap-2 py-8 px-4">
                        <p className="text-text-secondary text-sm">{T.search.noResults}</p>
                        <p className="text-text-secondary/50 text-xs text-center">{T.search.libraryOnly}</p>
                        <a
                          href={`https://retroachievements.org/searchresults.php?s=${encodeURIComponent(query.trim())}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline mt-1"
                        >
                          {T.publicProfile.searchOnRA} →
                        </a>
                      </div>
                    ) : (
                      <motion.ul
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                      >
                        {results.map((game) => (
                          <motion.li key={game.id} variants={resultVariants}>
                            <button
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-main transition-colors text-left cursor-pointer"
                              onClick={() => handleSelect(game.id)}
                            >
                              {game.icon ? (
                                <Image
                                  src={`https://retroachievements.org${game.icon}`}
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
                                <p className="text-sm font-medium text-text-main line-clamp-1">{game.title}</p>
                                <p className="text-xs text-text-secondary line-clamp-1">{game.consoleName}</p>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${STATUS_CLASSES[game.status]}`}>
                                {statusLabel(game.status)}
                              </span>
                            </button>
                          </motion.li>
                        ))}
                        {directGameId && !results.find((r) => r.id === directGameId) && (
                          <motion.li variants={resultVariants}>
                            <button
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-main transition-colors text-left cursor-pointer border-t border-white/5"
                              onClick={() => handleSelect(directGameId)}
                            >
                              <div className="w-8 h-8 rounded bg-bg-main flex items-center justify-center shrink-0 text-text-secondary text-xs font-bold">
                                #{directGameId}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-main">{T.search.openById}</p>
                                <p className="text-xs text-text-secondary">Game ID {directGameId}</p>
                              </div>
                            </button>
                          </motion.li>
                        )}
                      </motion.ul>
                    )}
                  </div>
                ) : (
                  <p className="text-text-secondary text-xs text-center py-6">{T.search.hint}</p>
                )
              )}

              {/* Results — Users */}
              {tab === 'users' && (() => {
                const q = query.trim()
                const tooShort = q.length < 3
                const hasSpace = q.includes(' ')
                const searching = !tooShort && !hasSpace

                if (!searching) {
                  return (
                    <div className="flex flex-col items-center gap-1.5 py-6 px-4">
                      <p className="text-text-secondary text-xs text-center">{T.publicProfile.searchUsersHint}</p>
                      {hasSpace && (
                        <p className="text-text-secondary/60 text-[10px] text-center">{T.publicProfile.noSpaces}</p>
                      )}
                    </div>
                  )
                }

                return (
                  <div className="max-h-105 overflow-y-auto">
                    {userLoading ? (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
                        <div className="h-4 bg-white/10 rounded animate-pulse w-32" />
                      </div>
                    ) : userResult ? (
                      <motion.div initial="hidden" animate="visible" variants={resultVariants}>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-main transition-colors text-left cursor-pointer"
                          onClick={() => handleUserSelect(userResult.User)}
                        >
                          <Image
                            src={`https://retroachievements.org${userResult.UserPic}`}
                            alt={userResult.User}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                            unoptimized
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-main">{userResult.User}</p>
                            <p className="text-xs text-text-secondary">{userResult.TotalPoints.toLocaleString()} pts</p>
                          </div>
                          <span className="text-[10px] text-text-secondary">→</span>
                        </button>
                      </motion.div>
                    ) : userError ? (
                      <div className="flex flex-col items-center gap-3 py-8 px-4">
                        <p className="text-text-secondary text-sm text-center">{T.publicProfile.noUserFound}</p>
                        <a
                          href={`https://retroachievements.org/userList.php?s=${encodeURIComponent(q)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          {T.publicProfile.searchOnRA} →
                        </a>
                      </div>
                    ) : null}
                  </div>
                )
              })()}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
