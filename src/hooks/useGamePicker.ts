import { useCallback, useMemo, useState } from 'react'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { fetchRaCandidateById } from '@/utils/apiCallsUtils'
import { searchCandidates, suggestCandidates, type GameCandidate } from '@/utils/gameCandidates'
import { gameKey, GAME_SOURCES } from '@/utils/gameRef'
import { parseRaGameId } from '@/utils/raGameId'
import type { GameSource } from '@/types/game'

const RESULTS_MAX = 40

/**
 * The state of the game picker (pin, add to a group, favourite): the search, the platform, what is picked
 * across searches, and a pasted RA id turned into a game. `candidates` are the games on offer, `excludeKeys`
 * the ones not to offer (already pinned, already in the group). Starts over every time it opens.
 */
export function useGamePicker({
  isOpen,
  candidates,
  excludeKeys,
  onlySource,
}: {
  isOpen: boolean
  candidates: GameCandidate[]
  excludeKeys: Set<string>
  onlySource?: GameSource
}) {
  const { isHidden } = useHiddenGames()
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<GameSource | null>(null)
  const [selected, setSelected] = useState<Map<string, GameCandidate>>(new Map())
  // The id whose lookup failed: the notice is for that id only, so it goes when another is typed.
  const [failedId, setFailedId] = useState<number | null>(null)

  useWhenChanged([isOpen], () => {
    if (isOpen) {
      setQuery('')
      setSource(null)
      setSelected(new Map())
      setFailedId(null)
    }
  })

  const parsedId = parseRaGameId(query)
  const directGameId = parsedId && !isHidden(parsedId, 'ra') ? parsedId : null

  const offered = useMemo(
    () => candidates.filter((c) => !excludeKeys.has(c.key) && (!onlySource || c.source === onlySource)),
    [candidates, excludeKeys, onlySource],
  )
  const sources = useMemo(() => GAME_SOURCES.filter((s) => offered.some((c) => c.source === s)), [offered])
  const pool = useMemo(() => (source ? offered.filter((c) => c.source === source) : offered), [offered, source])
  const searching = query.trim() !== ''
  const shown = useMemo(
    () => (directGameId ? [] : searching ? searchCandidates(pool, query, undefined, RESULTS_MAX) : suggestCandidates(pool)),
    [pool, query, searching, directGameId],
  )

  const toggle = useCallback((c: GameCandidate) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(c.key)) next.delete(c.key)
      else next.set(c.key, c)
      return next
    })
  }, [])

  /** The pasted id's game, looked up and picked (its row says so when it cannot be found). */
  async function pickDirect(id: number) {
    setFailedId(null)
    const c = await fetchRaCandidateById(id)
    if (!c) {
      setFailedId(id)
      return
    }
    toggle(c)
    setQuery('')
  }

  return {
    query, setQuery, source, setSource, sources, selected, setSelected, toggle,
    shown, searching, directGameId, directKey: directGameId ? gameKey('ra', directGameId) : null,
    failedId, pickDirect,
  }
}
