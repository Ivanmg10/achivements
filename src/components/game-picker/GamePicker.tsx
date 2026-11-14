'use client'

import { useState, useEffect, useId, useRef, type ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { useGamePicker } from '@/hooks/useGamePicker'
import type { GameCandidate } from '@/utils/gameCandidates'
import GamePickerTile from '@/components/game-picker/game-picker-tile/GamePickerTile'
import GamePickerIdRow from '@/components/game-picker/game-picker-id-row/GamePickerIdRow'
import GamePickerFooter from '@/components/game-picker/game-picker-footer/GamePickerFooter'
import AddGameModalPlatforms from '@/components/groups/add-game-modal-platforms/AddGameModalPlatforms'
import Modal from '@/components/ui/Modal'
import SearchInput from '@/components/ui/SearchInput'
import type { GameSource } from '@/types/game'

const NONE = new Set<string>()

type Common = {
  isOpen: boolean
  onClose: () => void
  title: string
  hint?: string
  searchLabel: string
  /** Games not to offer (already pinned, already in the group). */
  excludeKeys?: Set<string>
  /** Offer one platform only (the favourite game of a platform). */
  onlySource?: GameSource
  /** Above the games, in the scrolling body (the favourite already chosen). */
  top?: ReactNode
}

type Multi = Common & {
  /** Several games are picked across searches and confirmed together; resolves with the ones that failed. */
  onConfirm: (picked: GameCandidate[]) => Promise<GameCandidate[]>
  confirmLabel: (count: number) => string
  /** What the footer says before anything is picked. */
  pickPrompt: string
  errorText: string
  onPick?: undefined
}

type Single = Common & {
  /** One game, chosen with a click (the caller saves it and closes). */
  onPick: (game: GameCandidate) => void
  /** Games shown as chosen (the current favourite). */
  marked?: Set<string>
  busy?: boolean
  /** Shown when set: the save failed. */
  error?: string
  onConfirm?: undefined
}

/**
 * The one "pick games from your library" dialog: pin games, add them to a group (several, confirmed together) or
 * choose a favourite (one, at once). Opens on suggestions (what is being played, then wanted), narrows by title and
 * platform, or finds an RA game by a pasted id or link. The search sits in the Modal's fixed toolbar.
 */
export default function GamePicker(props: Multi | Single) {
  const { isOpen, onClose, title, hint, searchLabel, excludeKeys = NONE, onlySource, top } = props
  const { T } = useLanguage()
  const candidates = useGameCandidates(isOpen)
  const picker = useGamePicker({ isOpen, candidates, excludeKeys, onlySource })
  const { query, setQuery, source, setSource, sources, selected, setSelected, toggle, shown, searching, directGameId, directKey, failedId, pickDirect } = picker
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const hintId = useId()

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [isOpen])

  /** Adds what it can; the games that failed stay picked, to retry. */
  async function confirm() {
    if (props.onConfirm === undefined || selected.size === 0) return
    setSaving(true)
    setFailed(false)
    const left = await props.onConfirm([...selected.values()])
    setSaving(false)
    if (left.length) {
      setSelected(new Map(left.map((c) => [c.key, c])))
      setFailed(true)
      return
    }
    onClose()
  }

  const marked = props.onPick ? props.marked : undefined
  const busy = props.onPick ? props.busy : false
  const isPicked = (c: GameCandidate) => selected.has(c.key) || !!marked?.has(c.key)
  const choose = (c: GameCandidate) => (props.onPick ? props.onPick(c) : toggle(c))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={title}
      hint={hint}
      className="gap-4"
      toolbar={
        <>
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            aria-describedby={hintId}
            disabled={busy}
          />
          <p id={hintId} className="text-[11px] text-text-secondary -mt-1 short:hidden">{T.groups.searchHint}</p>
          {sources.length > 1 && <AddGameModalPlatforms sources={sources} value={source} onChange={setSource} />}
        </>
      }
      footer={
        props.onConfirm ? (
          <GamePickerFooter
            picked={[...selected.values()]}
            onRemove={toggle}
            onClear={() => setSelected(new Map())}
            onConfirm={confirm}
            confirmLabel={props.confirmLabel}
            pickPrompt={props.pickPrompt}
            error={failed ? props.errorText : undefined}
            saving={saving}
          />
        ) : undefined
      }
    >
      {top}
      {props.onPick && props.error && <p role="alert" className="text-xs text-danger">{props.error}</p>}
      <div>
        {directGameId && directKey && !excludeKeys.has(directKey) ? (
          <>
            <GamePickerIdRow id={directGameId} selected={selected.has(directKey)} onToggle={() => pickDirect(directGameId)} />
            {failedId === directGameId && (
              <p role="alert" className="text-xs text-danger mt-2">{T.search.noResults}</p>
            )}
          </>
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
                  <GamePickerTile candidate={c} selected={isPicked(c)} onToggle={() => choose(c)} />
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
    </Modal>
  )
}
