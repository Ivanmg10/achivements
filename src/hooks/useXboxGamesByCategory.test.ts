jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@/context/HiddenGamesContext', () => ({ useHiddenGames: jest.fn() }))

import { renderHook } from '@testing-library/react'
import { useXboxGamesByCategory } from './useXboxGamesByCategory'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const LIBRARY = [
  xboxGameFixture({ id: 1, title: 'Done', pctWon: 100 }),
  xboxGameFixture({ id: 2, title: 'Halfway', pctWon: 50 }),
  xboxGameFixture({ id: 3, title: 'Hidden', pctWon: 20 }),
  xboxGameFixture({ id: 4, title: 'Launched', pctWon: 0 }),
  // Owned, with no achievements at all: in no category.
  xboxGameFixture({ id: 5, title: 'Just owned', pctWon: 0, totalGamerscore: 0, maxPossible: 0, numAwarded: 0, earnedGamerscore: 0 }),
]

beforeEach(() => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({
    isLinked: true, library: LIBRARY, libraryLoading: false, libraryError: null, refetch: jest.fn(),
  })
  ;(useHiddenGames as jest.Mock).mockReturnValue({ isHidden: (id: number, source: string) => source === 'xbox' && id === 3 })
})

test.each([
  ['playing', ['Halfway']],
  ['completed', ['Done']],
  ['wantToPlay', ['Launched']],
])('%s holds its games, minus the hidden ones and the ones with no achievements', (category, titles) => {
  const { result } = renderHook(() => useXboxGamesByCategory(category))
  expect(result.current.games.map((g) => g.title)).toEqual(titles)
})

test('passes on the state of the shared library', () => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ isLinked: false, library: [], libraryLoading: true, libraryError: 'failed', refetch: jest.fn() })
  const { result } = renderHook(() => useXboxGamesByCategory('playing'))
  expect(result.current).toMatchObject({ games: [], isLinked: false, loading: true, error: 'failed' })
})
