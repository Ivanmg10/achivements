'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { IconSearch, IconX, IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameGroupItem } from '@/types/types'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { fetchRaCandidateById } from '@/utils/apiCallsUtils'
import { candidateToGroupItemBody, searchCandidates, GameCandidate } from '@/utils/gameCandidates'
import { gameKey } from '@/utils/gameRef'
import GamePickerRow from '@/components/game-picker/game-picker-row/GamePickerRow'
import GamePickerChip from '@/components/game-picker/game-picker-chip/GamePickerChip'

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

/**
 * Add games to a group — RA and Steam alike — by title, or an RA game by id.
 * `existingKeys` are the group's games as gameKey()s, so they are not offered.
 */
export default function AddGameModal({
  isOpen,
  onClose,
  groupId,
  existingKeys,
  onAdded,
}: {
  isOpen: boolean
  onClose: () => void
  groupId: number
  existingKeys: Set<string>
  onAdded: (items: GameGroupItem[]) => void
}) {
  const { T } = useLanguage()
  const candidates = useGameCandidates(isOpen)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Map<string, GameCandidate>>(new Map())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setTimeout(() => inputRef.current?.focus(), 50)
    setQuery('')
    setSelected(new Map())
    setError(false)
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

  const results = useMemo(
    () => (directGameId ? [] : searchCandidates(candidates, query, existingKeys)),
    [candidates, query, existingKeys, directGameId],
  )

  function toggle(c: GameCandidate) {
    setSelected((prev) => {
      const next = new Map(prev)
      next.has(c.key) ? next.delete(c.key) : next.set(c.key, c)
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
    onClose()
  }

  const directKey = directGameId ? gameKey('ra', directGameId) : null

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
                  placeholder={T.groups.searchGames}
                  aria-label={T.groups.searchGames}
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
                  {results.map((c) => (
                    <GamePickerRow key={c.key} candidate={c} selected={selected.has(c.key)} onToggle={() => toggle(c)} />
                  ))}
                  {directGameId && directKey && !existingKeys.has(directKey) && (
                    <button
                      onClick={() => addDirectById(directGameId)}
                      aria-pressed={selected.has(directKey)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-t border-white/5 ${selected.has(directKey) ? 'bg-accent/10' : 'hover:bg-bg-main'}`}
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
                        aria-hidden="true"
                        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${selected.has(directKey) ? 'bg-accent border-accent' : 'border-white/20'}`}
                      >
                        {selected.has(directKey) && <IconCheck className="w-3 h-3 text-bg-main" />}
                      </div>
                    </button>
                  )}
                </div>
              )}

              {selected.size > 0 && (
                <div className="border-t border-white/5 px-4 py-3 flex flex-col gap-3 shrink-0">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(selected.values()).map((c) => (
                      <GamePickerChip key={c.key} candidate={c} removeLabel={`${T.groups.removeGame} ${c.title}`} onRemove={() => toggle(c)} />
                    ))}
                  </div>
                  {error && (
                    <p role="alert" className="text-xs text-danger">
                      {T.groups.addError}
                    </p>
                  )}
                  <button
                    onClick={handleConfirm}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? '…' : `${T.groups.addGame} (${selected.size})`}
                  </button>
                </div>
              )}

              {!query.trim() && selected.size === 0 && (
                <p className="text-text-secondary text-xs text-center py-6">{T.groups.searchGames}</p>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
