'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { candidateIconUrl, searchCandidates } from '@/utils/gameCandidates'
import GamePickerRow from '@/components/game-picker/game-picker-row/GamePickerRow'
import type { GameSource } from '@/types/steam'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'

export type FavoriteGame = { id: number; title: string; imageIcon: string }

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

  // Closing starts it over; state, so while rendering. Focus is a side effect, so below.
  useWhenChanged([isOpen], () => {
    if (!isOpen) {
      setQuery('')
      setError(false)
    }
  })

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [isOpen])

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
    <Modal isOpen={isOpen} onClose={onClose} size="md" title={T.userData.favoriteGame} className="gap-3">
      <SearchInput
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={T.userData.favoriteGameSearch}
        aria-label={T.userData.favoriteGameSearch}
        disabled={saving}
      />

      {current && (
        <div className="flex items-center gap-3 rounded-tile bg-accent/[0.08] px-3 py-2.5">
          {current.imageIcon ? (
            <Image
              src={candidateIconUrl({ source, imageRef: current.imageIcon })}
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 rounded-box-sm object-cover shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-7 h-7 rounded-box-sm bg-ink/10 shrink-0" aria-hidden="true" />
          )}
          <span className="flex-1 min-w-0 text-sm font-medium text-accent line-clamp-1">{current.title}</span>
          <button
            onClick={() => save(null)}
            disabled={saving}
            className="text-xs text-danger hover:text-danger transition-colors disabled:opacity-50 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {T.userData.favoriteGameRemove}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-danger">
          {T.userData.favoriteGameError}
        </p>
      )}

      <div className="-mx-3 max-h-96 overflow-y-auto">
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
    </Modal>
  )
}
