'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { usePinnedGames } from '@/context/PinnedGamesContext'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { fetchRaCandidateById } from '@/utils/apiCallsUtils'
import { searchCandidates, GameCandidate } from '@/utils/gameCandidates'
import { gameKey } from '@/utils/gameRef'
import GamePickerRow from '@/components/game-picker/game-picker-row/GamePickerRow'
import GamePickerChip from '@/components/game-picker/game-picker-chip/GamePickerChip'
import { notify } from '@/lib/notify'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'

/** Pick games to pin — RA and Steam alike — by title, or an RA game by id. */
export default function PinGameModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const { pins, pinGame } = usePinnedGames()
  const candidates = useGameCandidates(isOpen)
  const { isHidden } = useHiddenGames()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Map<string, GameCandidate>>(new Map())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const pinnedKeys = useMemo(() => new Set(pins.map((p) => gameKey(p.source, p.id))), [pins])

  // Opening starts it over; state, so while rendering. Focus is a side effect, so below.
  useWhenChanged([isOpen], () => {
    if (isOpen) {
      setQuery('')
      setSelected(new Map())
      setError(false)
    }
  })

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [isOpen])

  /** A pasted RA id or game URL opens that RA game directly. */
  const directGameId = useMemo(() => {
    const q = query.trim()
    const id = /^\d{3,}$/.test(q) ? parseInt(q) : q.match(/retroachievements\.org\/game\/(\d+)/i)?.[1]
    const parsed = typeof id === 'string' ? parseInt(id) : id
    return parsed && !isHidden(parsed, 'ra') ? parsed : null
  }, [query, isHidden])

  const results = useMemo(
    () => (directGameId ? [] : searchCandidates(candidates, query, pinnedKeys)),
    [candidates, query, pinnedKeys, directGameId],
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

  async function handleConfirm() {
    if (selected.size === 0) return
    setSaving(true)
    setError(false)
    try {
      for (const c of selected.values()) {
        await pinGame(c.id, c.source)
      }
      setSaving(false)
      notify.success(T.toast.pinsUpdated)
      onClose()
    } catch {
      setSaving(false)
      setError(true)
    }
  }

  const directKey = directGameId ? gameKey('ra', directGameId) : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={T.pinnedGames.addAria}
      className="gap-3"
      footer={
        selected.size > 0 ? (
          <Button onClick={handleConfirm} disabled={saving} className="w-full">
            {saving ? '…' : `${T.pinnedGames.confirmPin} (${selected.size})`}
          </Button>
        ) : undefined
      }
    >
      <SearchInput
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={T.pinnedGames.searchPlaceholder}
        aria-label={T.pinnedGames.searchPlaceholder}
      />

      {(results.length > 0 || directGameId) && (
        <div className="-mx-3 max-h-80 overflow-y-auto">
          {results.map((c) => (
            <GamePickerRow key={c.key} candidate={c} selected={selected.has(c.key)} onToggle={() => toggle(c)} />
          ))}
          {directGameId && directKey && !pinnedKeys.has(directKey) && (
            <button
              onClick={() => addDirectById(directGameId)}
              aria-pressed={selected.has(directKey)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-box transition-colors text-left ${selected.has(directKey) ? 'bg-accent/10' : 'hover:bg-bg-main'}`}
            >
              <div className="w-8 h-8 rounded-box-sm bg-bg-main flex items-center justify-center shrink-0 text-xs font-bold text-text-secondary">
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
                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${selected.has(directKey) ? 'bg-accent border-accent' : 'border-ink/20'}`}
              >
                {selected.has(directKey) && <IconCheck className="w-3 h-3 text-bg-main" />}
              </div>
            </button>
          )}
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from(selected.values()).map((c) => (
            <GamePickerChip key={c.key} candidate={c} removeLabel={`Remove ${c.title}`} onRemove={() => toggle(c)} />
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-danger">
          {T.pinnedGames.error}
        </p>
      )}
    </Modal>
  )
}
