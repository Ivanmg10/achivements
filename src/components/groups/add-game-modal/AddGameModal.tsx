'use client'

import { useState, useEffect, useId, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { IconSearch, IconX, IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameGroupItem } from '@/types/types'
import type { GameSource } from '@/types/steam'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { fetchRaCandidateById } from '@/utils/apiCallsUtils'
import { candidateToGroupItemBody, searchCandidates, suggestCandidates, GameCandidate } from '@/utils/gameCandidates'
import { gameKey } from '@/utils/gameRef'
import { plural } from '@/utils/utils'
import GamePickerTile from '@/components/game-picker/game-picker-tile/GamePickerTile'
import GamePickerChip from '@/components/game-picker/game-picker-chip/GamePickerChip'
import AddGameModalPlatforms from '@/components/groups/add-game-modal-platforms/AddGameModalPlatforms'
import { notify } from '@/lib/notify'
import Button from '@/components/ui/Button'

const SOURCES: GameSource[] = ['ra', 'steam', 'psn', 'xbox']
const RESULTS_MAX = 40

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
const panelVariants: Variants = {
  hidden: { opacity: 0, y: -14, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15 } },
}

/**
 * Add games to a group, every platform alike. Opens on suggestions (what is
 * being played, then wanted), narrows by title and platform, or finds an RA
 * game by a pasted id or link. Games are picked as covers and added together;
 * `existingKeys` are the group's games as gameKey()s, so they are not offered.
 */
export default function AddGameModal({
  isOpen,
  onClose,
  groupId,
  groupTitle,
  existingKeys,
  onAdded,
}: {
  isOpen: boolean
  onClose: () => void
  groupId: number
  groupTitle?: string
  existingKeys: Set<string>
  onAdded: (items: GameGroupItem[]) => void
}) {
  const { T, lang } = useLanguage()
  const candidates = useGameCandidates(isOpen)
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<GameSource | null>(null)
  const [selected, setSelected] = useState<Map<string, GameCandidate>>(new Map())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()

  // Opening starts it over; state, so while rendering. Focus is a side effect, so below.
  useWhenChanged([isOpen], () => {
    if (isOpen) {
      setQuery('')
      setSource(null)
      setSelected(new Map())
      setError(false)
    }
  })

  useEffect(() => {
    if (!isOpen) return
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

  /** A pasted RA id or game URL opens that RA game directly. */
  const directGameId = useMemo(() => {
    const q = query.trim()
    if (/^\d{3,}$/.test(q)) return parseInt(q)
    const m = q.match(/retroachievements\.org\/game\/(\d+)/i)
    return m ? parseInt(m[1]) : null
  }, [query])

  const offered = useMemo(() => candidates.filter((c) => !existingKeys.has(c.key)), [candidates, existingKeys])
  const sources = useMemo(() => SOURCES.filter((s) => offered.some((c) => c.source === s)), [offered])
  const pool = useMemo(() => (source ? offered.filter((c) => c.source === source) : offered), [offered, source])
  const searching = query.trim() !== ''
  const shown = useMemo(
    () => (directGameId ? [] : searching ? searchCandidates(pool, query, undefined, RESULTS_MAX) : suggestCandidates(pool)),
    [pool, query, searching, directGameId],
  )

  function toggle(c: GameCandidate) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(c.key)) next.delete(c.key)
      else next.set(c.key, c)
      return next
    })
  }

  async function addDirectById(id: number) {
    const c = await fetchRaCandidateById(id)
    if (!c) return
    toggle(c)
    setQuery('')
  }

  async function addToGroup(c: GameCandidate): Promise<GameGroupItem | null> {
    try {
      const res = await fetch(`/api/groups/${groupId}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateToGroupItemBody(c)),
      })
      if (!res.ok) {
        console.error('[AddGameModal] add failed', res.status, c.key)
        return null
      }
      return (await res.json()) as GameGroupItem
    } catch (err) {
      console.error('[AddGameModal] add failed', err)
      return null
    }
  }

  /** Adds what it can; the games that failed stay selected, to retry. */
  async function handleConfirm() {
    if (selected.size === 0) return
    setSaving(true)
    setError(false)
    const added: GameGroupItem[] = []
    const failed = new Map<string, GameCandidate>()
    for (const c of selected.values()) {
      const item = await addToGroup(c)
      if (item) added.push(item)
      else failed.set(c.key, c)
    }
    setSaving(false)
    if (added.length) onAdded(added)
    if (failed.size) {
      setSelected(failed)
      setError(true)
      return
    }
    notify.success(T.toast.gamesAdded)
    onClose()
  }

  const directKey = directGameId ? gameKey('ra', directGameId) : null

  // On <body>, so the page's animated (transformed) wrapper does not become its frame.
  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-0 sm:p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="bg-bg-card w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[85vh] sm:rounded-2xl shadow-2xl ring-1 ring-ink/5 flex flex-col overflow-hidden"
            variants={panelVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3 px-4 sm:px-6 pt-5 pb-4 border-b border-ink/5 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id={titleId} className="text-lg font-bold text-text-main">{T.groups.addGames}</h2>
                  {groupTitle && <p className="text-sm text-text-secondary truncate">{T.groups.addTo.replace('{group}', groupTitle)}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 -m-1 rounded-lg text-text-secondary hover:text-text-main hover:bg-ink/5 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  aria-label={T.groups.close}
                >
                  <IconX className="w-5 h-5" aria-hidden />
                </button>
              </div>

              <div className="relative">
                <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={T.groups.searchGames}
                  aria-label={T.groups.searchGames}
                  aria-describedby={`${titleId}-hint`}
                  className="w-full h-11 bg-bg-main rounded-xl pl-10 pr-3 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/70"
                />
              </div>
              <p id={`${titleId}-hint`} className="text-[11px] text-text-secondary -mt-1">{T.groups.searchHint}</p>

              {sources.length > 1 && <AddGameModalPlatforms sources={sources} value={source} onChange={setSource} />}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4">
              {directGameId && directKey && !existingKeys.has(directKey) ? (
                <button
                  type="button"
                  onClick={() => addDirectById(directGameId)}
                  aria-pressed={selected.has(directKey)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ring-1 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${selected.has(directKey) ? 'ring-accent bg-accent/10' : 'ring-ink/10 hover:bg-bg-main'}`}
                >
                  <span aria-hidden="true" className="w-10 h-10 rounded-lg bg-bg-main flex items-center justify-center shrink-0 text-xs font-bold text-text-secondary">ID</span>
                  <span className="flex-1 min-w-0 text-sm font-medium text-text-main">
                    {T.search.openById} #{directGameId}
                  </span>
                  {selected.has(directKey) && <IconCheck className="w-4 h-4 text-accent" aria-hidden />}
                </button>
              ) : shown.length > 0 ? (
                <>
                  {!searching && (
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-text-main">{T.groups.suggestions}</h3>
                      <p className="text-xs text-text-secondary">{T.groups.suggestionsHint}</p>
                    </div>
                  )}
                  <ul className="grid gap-x-3 gap-y-4 grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]">
                    {shown.map((c) => (
                      <li key={c.key} className="min-w-0 flex">
                        <GamePickerTile candidate={c} selected={selected.has(c.key)} onToggle={() => toggle(c)} />
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-text-secondary text-center py-12">
                  {searching ? T.groups.noMatches.replace('{q}', query.trim()) : T.groups.nothingToSuggest}
                </p>
              )}
            </div>

            <div className="border-t border-ink/5 px-4 sm:px-6 py-3 flex flex-col gap-2 shrink-0 bg-bg-card">
              {selected.size > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {Array.from(selected.values()).map((c) => (
                    <GamePickerChip key={c.key} candidate={c} removeLabel={`${T.groups.removeGame} ${c.title}`} onRemove={() => toggle(c)} />
                  ))}
                </div>
              )}
              {error && (
                <p role="alert" className="text-xs text-danger">
                  {T.groups.addError}
                </p>
              )}
              <div className="flex items-center gap-3">
                <p role="status" className="text-xs text-text-secondary flex-1 min-w-0">
                  {selected.size > 0 ? T.groups.selectedCount.replace('{n}', String(selected.size)) : T.groups.pickToAdd}
                </p>
                {selected.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelected(new Map())}
                    className="text-xs text-text-secondary hover:text-text-main rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    {T.groups.clearSelection}
                  </button>
                )}
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={saving || selected.size === 0}
                >
                  {saving ? '…' : selected.size > 0 ? T.groups.addSelected.replace('{games}', plural(selected.size, T.plurals.games, lang)) : T.groups.addGames}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
