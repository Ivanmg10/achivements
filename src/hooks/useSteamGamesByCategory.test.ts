import { renderHook } from '@testing-library/react'
import { useSteamGamesByCategory } from './useSteamGamesByCategory'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { SteamGameProgress } from '@/types/steam'

jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))

function game(id: number, title: string, overrides: Partial<SteamGameProgress> = {}): SteamGameProgress {
  return {
    ...toSteamGameProgress({ appid: id, name: title, playtime_forever: 60, has_community_visible_stats: true }),
    ...overrides,
  }
}

const LIBRARY = [
  game(1, 'Zeta backlog', { playtimeForever: 0 }),
  game(2, 'Alpha backlog', { playtimeForever: 0 }),
  game(3, 'Half done', { achievementsLoaded: true, maxPossible: 10, numAwarded: 5, lastPlayed: '2024-01-01T00:00:00.000Z' }),
  game(4, 'Recent half', { achievementsLoaded: true, maxPossible: 10, numAwarded: 2, lastPlayed: '2024-06-01T00:00:00.000Z' }),
  game(5, 'All done', { achievementsLoaded: true, maxPossible: 4, numAwarded: 4, lastPlayed: '2024-02-01T00:00:00.000Z' }),
  game(6, 'Unknown', { achievementsLoaded: false }),
]

function setContext(overrides: Record<string, unknown> = {}) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({
    isLinked: true, library: LIBRARY, libraryLoading: false, libraryError: null, ...overrides,
  })
}

beforeEach(() => setContext())

test('want to play is the untouched backlog, alphabetical', () => {
  const { result } = renderHook(() => useSteamGamesByCategory('wantToPlay'))
  expect(result.current.games.map((g) => g.title)).toEqual(['Alpha backlog', 'Zeta backlog'])
})

test('playing is partially completed games, most recent first', () => {
  const { result } = renderHook(() => useSteamGamesByCategory('playing'))
  expect(result.current.games.map((g) => g.title)).toEqual(['Recent half', 'Half done'])
})

test('completed is fully completed games', () => {
  const { result } = renderHook(() => useSteamGamesByCategory('completed'))
  expect(result.current.games.map((g) => g.title)).toEqual(['All done'])
})

test('games with unknown progress appear in no category', () => {
  const all = ['wantToPlay', 'playing', 'completed'].flatMap(
    (c) => renderHook(() => useSteamGamesByCategory(c)).result.current.games,
  )
  expect(all.map((g) => g.title)).not.toContain('Unknown')
})

test('an unknown category yields nothing', () => {
  const { result } = renderHook(() => useSteamGamesByCategory('bogus'))
  expect(result.current.games).toEqual([])
})

test('passes through loading, error and link state', () => {
  setContext({ isLinked: false, libraryLoading: true, libraryError: 'boom' })
  const { result } = renderHook(() => useSteamGamesByCategory('playing'))
  expect(result.current).toMatchObject({ isLinked: false, loading: true, error: 'boom' })
})

test('does not mutate the shared library while sorting', () => {
  const before = LIBRARY.map((g) => g.id)
  renderHook(() => useSteamGamesByCategory('wantToPlay'))
  renderHook(() => useSteamGamesByCategory('playing'))
  expect(LIBRARY.map((g) => g.id)).toEqual(before)
})

describe('progressTruncated', () => {
  test('is true when a played game with achievements has no counts', () => {
    // LIBRARY contains 'Unknown': played, has stats, not loaded.
    const { result } = renderHook(() => useSteamGamesByCategory('playing'))
    expect(result.current.progressTruncated).toBe(true)
  })

  test('is false when every countable game was counted', () => {
    setContext({ library: LIBRARY.filter((g) => g.title !== 'Unknown') })
    const { result } = renderHook(() => useSteamGamesByCategory('playing'))
    expect(result.current.progressTruncated).toBe(false)
  })

  test('ignores unplayed games and games without achievements', () => {
    setContext({
      library: [
        game(10, 'Never played', { playtimeForever: 0, achievementsLoaded: false }),
        game(11, 'No stats', { hasStats: false, achievementsLoaded: false }),
      ],
    })
    const { result } = renderHook(() => useSteamGamesByCategory('playing'))
    expect(result.current.progressTruncated).toBe(false)
  })
})

test('exposes the shared refetch', () => {
  const refetch = jest.fn()
  setContext({ refetch })
  const { result } = renderHook(() => useSteamGamesByCategory('playing'))
  result.current.refetch()
  expect(refetch).toHaveBeenCalledTimes(1)
})
