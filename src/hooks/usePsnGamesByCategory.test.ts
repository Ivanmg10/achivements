jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@/context/HiddenGamesContext', () => ({ useHiddenGames: jest.fn() }))

import { renderHook } from '@testing-library/react'
import { usePsnGamesByCategory } from './usePsnGamesByCategory'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { useHiddenGames } from '@/context/HiddenGamesContext'

const LIBRARY = [
  { id: 1, title: 'Done', pctWon: 100 },
  { id: 2, title: 'Halfway', pctWon: 50 },
  { id: 3, title: 'Hidden', pctWon: 20 },
  { id: 4, title: 'Launched', pctWon: 0 },
]

beforeEach(() => {
  ;(usePsnGamesData as jest.Mock).mockReturnValue({
    isLinked: true, library: LIBRARY, libraryLoading: false, libraryError: null, refetch: jest.fn(),
  })
  ;(useHiddenGames as jest.Mock).mockReturnValue({ isHidden: (id: number, source: string) => source === 'psn' && id === 3 })
})

test.each([
  ['playing', ['Halfway']],
  ['completed', ['Done']],
  ['wantToPlay', ['Launched']],
])('%s holds its games, minus the hidden ones', (category, titles) => {
  const { result } = renderHook(() => usePsnGamesByCategory(category))
  expect(result.current.games.map((g) => g.title)).toEqual(titles)
})
