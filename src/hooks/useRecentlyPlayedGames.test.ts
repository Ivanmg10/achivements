import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRecentlyPlayedGames } from './useRecentlyPlayedGames'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

jest.mock('@/lib/fetchWithRetry', () => ({
  fetchWithRetry: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

test('starts in a loading state while the session is resolving', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'loading' })
  const { result } = renderHook(() => useRecentlyPlayedGames())
  expect(result.current.isLoading).toBe(true)
  expect(result.current.games).toEqual([])
})

test('stops loading and returns the games once the fetch resolves', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  const games = [{ GameID: 1, Title: 'Sly Cooper' }]
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(games)

  const { result } = renderHook(() => useRecentlyPlayedGames())

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.games).toEqual(games)
})

test('stops loading with an empty list when unauthenticated, instead of loading forever', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
  const { result } = renderHook(() => useRecentlyPlayedGames())
  expect(result.current.isLoading).toBe(false)
  expect(result.current.games).toEqual([])
})
