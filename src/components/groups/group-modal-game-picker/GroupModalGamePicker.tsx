'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { IconBrandSteam, IconSearch, IconTrash } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useGameCandidates } from '@/hooks/useGameCandidates'
import { fetchRaCandidateById } from '@/utils/apiCallsUtils'
import { candidateIconUrl, searchCandidates, GameCandidate } from '@/utils/gameCandidates'
import { gameKey } from '@/utils/gameRef'

const MAX_RESULTS = 8

/**
 * The "add games" part of the create-group form: the chosen games, a search
 * box, and matches from RA and Steam alike (or an RA game by pasted id).
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

  const results = useMemo(
    () => (directGameId ? [] : searchCandidates(candidates, query, selectedKeys, MAX_RESULTS)),
    [candidates, query, selectedKeys, directGameId],
  )

  function add(c: GameCandidate) {
    if (!selectedKeys.has(c.key)) onChange([...selected, c])
    setQuery('')
  }

  async function addById(id: number) {
    setLookupFailed(false)
    const c = await fetchRaCandidateById(id)
    if (c) add(c)
    else setLookupFailed(true)
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="group-game-search" className="text-[10px] uppercase tracking-widest text-text-secondary">
        {T.groups.addGame}
      </label>

      {selected.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {selected.map((g) => {
            const icon = candidateIconUrl(g)
            return (
              <li key={g.key} className="flex items-center gap-2 bg-bg-main rounded-lg px-2.5 py-1.5">
                {icon && <Image src={icon} alt="" width={20} height={20} className="rounded shrink-0" unoptimized />}
                <span className="text-xs flex-1 line-clamp-1">{g.title}</span>
                {g.source === 'steam' && (
                  <IconBrandSteam size={12} className="text-[#66c0f4] shrink-0" aria-label="Steam" />
                )}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((s) => s.key !== g.key))}
                  aria-label={`${T.groups.removeGame} ${g.title}`}
                  className="text-text-secondary hover:text-red-400 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  <IconTrash className="w-3.5 h-3.5" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="relative">
        <IconSearch
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none"
          aria-hidden
        />
        <input
          id="group-game-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLookupFailed(false)
          }}
          placeholder={T.groups.searchGames}
          className="w-full bg-bg-main rounded-lg pl-8 pr-3 py-2 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/70"
        />
      </div>

      {(results.length > 0 || directGameId) && (
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
          {results.map((c) => {
            const icon = candidateIconUrl(c)
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => add(c)}
                className="flex items-center gap-2 bg-bg-main hover:bg-white/5 rounded-lg px-2.5 py-1.5 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                {icon && <Image src={icon} alt="" width={20} height={20} className="rounded shrink-0" unoptimized />}
                <span className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs line-clamp-1">{c.title}</span>
                  <span className="text-[10px] text-text-secondary flex items-center gap-1">
                    {c.source === 'steam' && (
                      <IconBrandSteam size={10} className="text-[#66c0f4] shrink-0" aria-hidden="true" />
                    )}
                    {c.subtitle}
                  </span>
                </span>
              </button>
            )
          })}
          {directGameId && !selectedKeys.has(gameKey('ra', directGameId)) && (
            <button
              type="button"
              onClick={() => addById(directGameId)}
              className="flex items-center gap-2 bg-bg-main hover:bg-white/5 rounded-lg px-2.5 py-1.5 transition-colors text-left border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <span
                aria-hidden="true"
                className="w-5 h-5 rounded bg-bg-card flex items-center justify-center shrink-0 text-[9px] font-bold text-text-secondary"
              >
                ID
              </span>
              <span className="text-xs text-text-secondary">
                {T.search.openById} #{directGameId}
              </span>
            </button>
          )}
        </div>
      )}

      {lookupFailed && (
        <p role="alert" className="text-xs text-red-400">
          {T.search.noResults}
        </p>
      )}
    </div>
  )
}
