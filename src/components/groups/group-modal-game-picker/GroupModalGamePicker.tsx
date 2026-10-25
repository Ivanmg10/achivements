'use client'

import { useMemo, useState } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { fetchRaCandidateById } from '@/utils/apiCallsUtils'
import { searchCandidates, suggestCandidates, GameCandidate } from '@/utils/gameCandidates'
import { gameKey } from '@/utils/gameRef'
import GamePickerTile from '@/components/game-picker/game-picker-tile/GamePickerTile'
import GamePickerChip from '@/components/game-picker/game-picker-chip/GamePickerChip'
import { fieldClass } from '@/components/ui/Input'

const RESULTS_MAX = 24

/**
 * The "games" part of the create-group form: suggestions until something is
 * typed (what is being played, then wanted), then matches from every platform
 * (or an RA game by pasted id), all as covers to tick; the chosen ones above.
 * `enabled` delays loading the candidate lists until the form is open.
 */
export default function GroupModalGamePicker({
  enabled,
  selected,
  onChange,
}: {
  enabled: boolean
  selected: GameCandidate[]
  onChange: (games: GameCandidate[]) => void
}) {
  const { T } = useLanguage()
  const candidates = useGameCandidates(enabled)
  const [query, setQuery] = useState('')
  const [lookupFailed, setLookupFailed] = useState(false)

  const selectedKeys = useMemo(() => new Set(selected.map((g) => g.key)), [selected])

  const directGameId = useMemo(() => {
    const q = query.trim()
    if (/^\d{3,}$/.test(q)) return parseInt(q)
    const m = q.match(/retroachievements\.org\/game\/(\d+)/i)
    return m ? parseInt(m[1]) : null
  }, [query])

  const searching = query.trim() !== ''
  // Chosen games stay in the grid (ticked), so they can be unticked where they were picked.
  const shown = useMemo(
    () => (directGameId ? [] : searching ? searchCandidates(candidates, query, undefined, RESULTS_MAX) : suggestCandidates(candidates, undefined, RESULTS_MAX)),
    [candidates, query, searching, directGameId],
  )

  function toggle(c: GameCandidate) {
    onChange(selectedKeys.has(c.key) ? selected.filter((s) => s.key !== c.key) : [...selected, c])
  }

  async function addById(id: number) {
    setLookupFailed(false)
    const c = await fetchRaCandidateById(id)
    if (!c) {
      setLookupFailed(true)
      return
    }
    if (!selectedKeys.has(c.key)) onChange([...selected, c])
    setQuery('')
  }

  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div>
        <label htmlFor="group-game-search" className="text-[10px] uppercase tracking-widest text-text-secondary">
          {T.groups.gamesLabel}
        </label>
        <p className="text-xs text-text-secondary">{T.groups.gamesOptional}</p>
      </div>

      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" aria-hidden />
        <input
          id="group-game-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLookupFailed(false)
          }}
          placeholder={T.groups.searchGames}
          aria-describedby="group-game-search-hint"
          className={fieldClass({ size: 'sm', icon: true })}
        />
      </div>
      <p id="group-game-search-hint" className="text-[11px] text-text-secondary -mt-2">{T.groups.searchHint}</p>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((g) => (
            <GamePickerChip key={g.key} candidate={g} removeLabel={`${T.groups.removeGame} ${g.title}`} onRemove={() => toggle(g)} />
          ))}
        </div>
      )}

      {directGameId ? (
        !selectedKeys.has(gameKey('ra', directGameId)) && (
          <button
            type="button"
            onClick={() => addById(directGameId)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl ring-1 ring-ink/10 hover:bg-bg-main transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <span aria-hidden="true" className="w-8 h-8 rounded-lg bg-bg-main flex items-center justify-center shrink-0 text-[10px] font-bold text-text-secondary">ID</span>
            <span className="text-sm text-text-main">{T.search.openById} #{directGameId}</span>
          </button>
        )
      ) : shown.length > 0 ? (
        <>
          {!searching && <p className="text-xs font-semibold text-text-main">{T.groups.suggestions}</p>}
          <ul className="grid gap-x-3 gap-y-4 grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]">
            {shown.map((c) => (
              <li key={c.key} className="min-w-0 flex">
                <GamePickerTile candidate={c} selected={selectedKeys.has(c.key)} onToggle={() => toggle(c)} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        searching && <p className="text-sm text-text-secondary text-center py-6">{T.groups.noMatches.replace('{q}', query.trim())}</p>
      )}

      {lookupFailed && (
        <p role="alert" className="text-xs text-danger">
          {T.search.noResults}
        </p>
      )}
    </div>
  )
}
