'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { IconSearch, IconX, IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievementsUserProfile } from '@/types/types'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { searchCandidates } from '@/utils/gameCandidates'
import { gameHref, GameRef } from '@/utils/gameRef'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import SearchModalGameResult from './search-modal-game-result/SearchModalGameResult'

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

type SearchTab = 'games' | 'users'
type PlatformFilter = 'all' | 'ra' | 'steam'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

export default function SearchModal({ isOpen, onClose, initialQuery = '' }: SearchModalProps) {
  const { T } = useLanguage()
  const router = useRouter()
  const candidates = useGameCandidates(isOpen)
  const [tab, setTab] = useState<SearchTab>('games')
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all')
  const [query, setQuery] = useState('')
  const [userResult, setUserResult] = useState<RetroAchievementsUserProfile | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState(false)
  const userDebounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery)
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    } else {
      setQuery('')
      setTab('games')
      setPlatformFilter('all')
      setUserResult(null)
      setUserError(false)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const allResults = useMemo(() => searchCandidates(candidates, query), [candidates, query])
  const results = useMemo(
    () => (platformFilter === 'all' ? allResults : allResults.filter((r) => r.source === platformFilter)),
    [allResults, platformFilter],
  )
  const hasBothPlatforms = allResults.some((r) => r.source === 'ra') && allResults.some((r) => r.source === 'steam')

  const directGameId = useMemo(() => {
    const q = query.trim()
    if (/^\d{3,}$/.test(q)) return parseInt(q)
    const urlMatch = q.match(/retroachievements\.org\/game\/(\d+)/i)
    if (urlMatch) return parseInt(urlMatch[1])
    return null
  }, [query])

  const handleSelect = useCallback(
    ({ source, id }: GameRef) => {
      router.push(gameHref(source, id))
      onClose()
    },
    [router, onClose],
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
                    aria-pressed={tab === t}
                    className={`py-2 text-xs font-medium border-b-2 transition-colors ${tab === t ? 'border-accent text-text-main' : 'border-transparent text-text-secondary hover:text-text-main'}`}
                  >
                    {t === 'games' ? T.publicProfile.gamesTab : T.publicProfile.userTab}
                  </button>
                ))}
              </div>

              {/* Platform filter — only worth showing once both platforms are in the library */}
              {tab === 'games' && hasBothPlatforms && (
                <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5" role="group" aria-label={T.search.platformAll}>
                  {(
                    [
                      { value: 'all' as PlatformFilter, label: T.search.platformAll, icon: null },
                      { value: 'ra' as PlatformFilter, label: T.search.platformRa, icon: <RaLogo height={11} /> },
                      { value: 'steam' as PlatformFilter, label: T.search.platformSteam, icon: <SteamLogo size={12} className="text-[#66c0f4]" aria-hidden="true" /> },
                    ]
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPlatformFilter(opt.value)}
                      aria-pressed={platformFilter === opt.value}
                      className={`flex items-center gap-1.5 pb-1 text-[11px] font-medium border-b-2 transition-colors ${
                        platformFilter === opt.value
                          ? 'border-accent text-text-main'
                          : 'border-transparent text-text-secondary/70 hover:text-text-secondary'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

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
                          <motion.li key={game.key} variants={resultVariants}>
                            <SearchModalGameResult game={game} onSelect={() => handleSelect(game)} />
                          </motion.li>
                        ))}
                        {directGameId && !results.find((r) => r.source === 'ra' && r.id === directGameId) && (
                          <motion.li variants={resultVariants}>
                            <button
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-main transition-colors text-left cursor-pointer border-t border-white/5"
                              onClick={() => handleSelect({ source: 'ra', id: directGameId })}
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
                            <p className="text-xs text-text-secondary">{(userResult.TotalPoints ?? 0).toLocaleString()} pts</p>
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
