import { render, renderHook, act, screen, waitFor } from '@testing-library/react'
import { RecentlyPlayedGamesProvider, useRecentlyPlayedGames } from './RecentlyPlayedGamesContext'
import { useSession } from 'next-auth/react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn() }))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <RecentlyPlayedGamesProvider>{children}</RecentlyPlayedGamesProvider>
)

beforeEach(() => {
  jest.clearAllMocks()
})

test('starts in a loading state while the session is resolving', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'loading' })
  const { result } = renderHook(() => useRecentlyPlayedGames(), { wrapper })
  expect(result.current.isLoading).toBe(true)
  expect(result.current.games).toEqual([])
})

test('fetches once when authenticated', async () => {
  const games = [{ GameID: 1, Title: 'Sly Cooper' }]
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(games)
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })

  const { result } = renderHook(() => useRecentlyPlayedGames(), { wrapper })

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getRecentlyPlayedGames')
  expect(fetchWithRetry).toHaveBeenCalledTimes(1)
  expect(result.current.games).toEqual(games)
})

test('stops loading with an empty list when unauthenticated', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
  const { result } = renderHook(() => useRecentlyPlayedGames(), { wrapper })
  expect(result.current.isLoading).toBe(false)
  expect(result.current.games).toEqual([])
})

test('shares a single fetch across multiple consumers under the same provider', async () => {
  const games = [{ GameID: 1, Title: 'Sly Cooper' }]
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(games)
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })

  function Consumer({ testId }: { testId: string }) {
    const { games } = useRecentlyPlayedGames()
    return <span data-testid={testId}>{games.length}</span>
  }

  render(
    <RecentlyPlayedGamesProvider>
      <Consumer testId="a" />
      <Consumer testId="b" />
    </RecentlyPlayedGamesProvider>
  )

  await waitFor(() => expect(screen.getByTestId('a')).toHaveTextContent('1'))
  expect(screen.getByTestId('b')).toHaveTextContent('1')
  expect(fetchWithRetry).toHaveBeenCalledTimes(1)
})

test('refetch clears games and fetches again', async () => {
  const games = [{ GameID: 1, Title: 'Sly Cooper' }]
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(games)
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })

  const { result } = renderHook(() => useRecentlyPlayedGames(), { wrapper })
  await waitFor(() => expect(result.current.games).toEqual(games))

  act(() => result.current.refetch())
  expect(result.current.games).toEqual([])
  await waitFor(() => expect(result.current.games).toEqual(games))
  expect(fetchWithRetry).toHaveBeenCalledTimes(2)
})
