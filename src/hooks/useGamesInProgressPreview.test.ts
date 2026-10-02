import { renderHook } from '@testing-library/react'
import { useGamesInProgressPreview } from './useGamesInProgressPreview'
import { useGamesData } from '@/context/GamesDataContext'

jest.mock('@/context/GamesDataContext', () => ({ useGamesData: jest.fn() }))

test('hands on the in-progress games from the shared context', () => {
  const refetch = jest.fn()
  ;(useGamesData as jest.Mock).mockReturnValue({ inProgress: [{ GameID: 1 }], isLoading: false, error: false, refetch })
  const { result } = renderHook(() => useGamesInProgressPreview())
  expect(result.current).toEqual({ listGames: [{ GameID: 1 }], isLoading: false, error: false, refetch })
})
