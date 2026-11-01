'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { useRaLinked } from '@/hooks/useRaLinked'
import { USER_SEARCH_MIN, useUserSearch } from '@/hooks/useUserSearch'
import { useRecentUsers, type RecentUser } from '@/hooks/useRecentUsers'
import { useRecentSearches } from '@/hooks/useRecentSearches'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { searchCandidates } from '@/utils/gameCandidates'
import { gameHref, GameRef } from '@/utils/gameRef'
import { plural } from '@/utils/utils'
import { canUseXbox } from '@/utils/xboxAccess'
import IconButton from '@/components/ui/IconButton'
import SearchModalGameResult from './search-modal-game-result/SearchModalGameResult'
import SearchModalUserResults from './search-modal-user-results/SearchModalUserResults'
import SearchModalHome from './search-modal-home/SearchModalHome'
import SearchModalGroup from './search-modal-group/SearchModalGroup'
import SearchModalRow from './search-modal-row/SearchModalRow'

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

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

/**
 * The top bar's search (the agreed "command" panel): one box that finds your
 * games and people at once, grouped. Before typing it offers the games played
 * last, the searches made lately, the profiles opened lately and where to go.
 * ↑ and ↓ move through every row, Enter on the box opens the first one.
 */
export default function SearchModal({ isOpen, onClose, initialQuery = '' }: SearchModalProps) {
  const { T, lang } = useLanguage()
  const router = useRouter()
  const { data: session } = useSession()
  const candidates = useGameCandidates(isOpen)
  const { isHidden } = useHiddenGames()
  const raLinked = useRaLinked()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const { recent: recentUsers, remember: rememberUser } = useRecentUsers()
  const { recent: recentSearches, remember: rememberSearch, clear: clearSearches } = useRecentSearches()

  // Opening seeds the search, closing clears it; state, so while rendering. Only
  // `isOpen` matters: a different initialQuery while open must not wipe what was typed.
  useWhenChanged([isOpen], () => {
    setQuery(isOpen ? initialQuery : '')
  })

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const typed = query.trim()
  const users = useUserSearch(query, isOpen)
  const results = useMemo(() => searchCandidates(candidates, query), [candidates, query])

  const directGameId = useMemo(() => {
    if (!raLinked) return null
    const id = /^\d{3,}$/.test(typed) ? parseInt(typed) : typed.match(/retroachievements\.org\/game\/(\d+)/i)?.[1]
    const parsed = typeof id === 'string' ? parseInt(id) : id
    return parsed && !isHidden(parsed, 'ra') ? parsed : null
  }, [typed, raLinked, isHidden])

  // What the box searches, by name: only the platforms this person can use.
  const platforms = ['RetroAchievements', 'Steam', 'PlayStation', ...(canUseXbox(session?.user?.admin) ? ['Xbox'] : [])]
  const platformList = new Intl.ListFormat(lang, { type: 'conjunction' }).format(platforms)

  const go = useCallback(
    (href: string) => {
      router.push(href)
      onClose()
    },
    [router, onClose],
  )

  const handleSelect = useCallback(
    ({ source, id }: GameRef) => {
      rememberSearch(query)
      go(gameHref(source, id))
    },
    [go, query, rememberSearch],
  )

  const handleUserSelect = useCallback(
    (user: RecentUser) => {
      rememberUser(user)
      if (query.trim()) rememberSearch(query)
      go(`/user/${encodeURIComponent(user.username)}`)
    },
    [go, query, rememberUser, rememberSearch],
  )

  /** ↑ and ↓ through every row of the panel; ↑ from the first goes back to the box. */
  function onBodyKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const options = [...(bodyRef.current?.querySelectorAll<HTMLButtonElement>('[data-search-option]') ?? [])]
    const at = options.indexOf(document.activeElement as HTMLButtonElement)
    e.preventDefault()
    if (e.key === 'ArrowDown') options[Math.min(at + 1, options.length - 1)]?.focus()
    else if (at <= 0) inputRef.current?.focus()
    else options[at - 1].focus()
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const first = bodyRef.current?.querySelector<HTMLButtonElement>('[data-search-option]')
    if (!first) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      first.focus()
    } else if (e.key === 'Enter' && typed) {
      e.preventDefault()
      first.click()
    }
  }

  const count = results.length + (users.active ? users.results.length : 0)

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
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-full max-w-[45.5rem] px-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={T.search.placeholder}
              className="bg-bg-header rounded-sheet overflow-hidden ring-1 ring-inset ring-ink/10 shadow-[0_30px_70px_rgb(0_0_0/0.55)]"
              variants={contentVariants}
              onClick={(e) => e.stopPropagation()}
            >
              {/* The box */}
              <div className="flex items-center gap-3 h-[3.75rem] px-[1.125rem] shadow-[inset_0_-1px_0_rgb(var(--ink)/0.08)]">
                <IconSearch className="w-5 h-5 text-accent shrink-0" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder={T.search.placeholder}
                  className="flex-1 min-w-0 bg-transparent text-text-main text-[1.1875rem] font-semibold outline-none placeholder:text-text-secondary placeholder:font-normal"
                  aria-label={T.search.placeholder}
                />
                {typed && (
                  <span className="text-[0.8125rem] text-text-secondary shrink-0" role="status">
                    {plural(count, T.plurals.results, lang)}
                  </span>
                )}
                <IconButton onClick={onClose} aria-label={T.cards.close} size="sm">
                  <IconX className="w-4 h-4" aria-hidden />
                </IconButton>
              </div>

              <div ref={bodyRef} onKeyDown={onBodyKeyDown} className="max-h-[60vh] overflow-y-auto pb-1.5">
                {!typed ? (
                  <SearchModalHome
                    recentSearches={recentSearches}
                    onPickSearch={(q) => {
                      setQuery(q)
                      inputRef.current?.focus()
                    }}
                    onClearSearches={clearSearches}
                    recentUsers={recentUsers}
                    onPickUser={handleUserSelect}
                    onGo={go}
                  />
                ) : (
                  <>
                    {(results.length > 0 || directGameId) && (
                      <SearchModalGroup title={`${T.search.yourGames} · ${results.length}`}>
                        <ul>
                          {results.map((game) => (
                            <li key={game.key}>
                              <SearchModalGameResult game={game} query={query} onSelect={() => handleSelect(game)} />
                            </li>
                          ))}
                          {directGameId && !results.find((r) => r.source === 'ra' && r.id === directGameId) && (
                            <li>
                              <SearchModalRow
                                media={<span className="text-[0.625rem] font-bold text-text-secondary">#{directGameId}</span>}
                                title={T.search.openById}
                                sub={`Game ID ${directGameId}`}
                                onSelect={() => handleSelect({ source: 'ra', id: directGameId })}
                              />
                            </li>
                          )}
                        </ul>
                      </SearchModalGroup>
                    )}

                    <SearchModalUserResults users={users} onSelect={handleUserSelect} />

                    {results.length === 0 && !directGameId && (
                      <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                        <p className="text-text-secondary text-sm">{T.search.noResults}</p>
                        <p className="text-text-secondary text-xs">{T.search.libraryOnly}</p>
                        {typed.length < USER_SEARCH_MIN && <p className="text-text-secondary text-xs">{T.search.peopleMin}</p>}
                        {raLinked && (
                          <a
                            href={`https://retroachievements.org/searchresults.php?s=${encodeURIComponent(typed)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline mt-1"
                          >
                            {T.publicProfile.searchOnRA} →
                          </a>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center px-[1.125rem] py-2.5 shadow-[inset_0_1px_0_rgb(var(--ink)/0.08)] text-xs text-text-secondary">
                {T.search.searchesIn.replace('{platforms}', platformList)}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
