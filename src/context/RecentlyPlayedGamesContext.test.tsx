import { render, renderHook, act, screen, waitFor } from '@testing-library/react'
import { RecentlyPlayedGamesProvider, useRecentlyPlayedGames } from './RecentlyPlayedGamesContext'
import { useSession } from 'next-auth/react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@/lib/fetchWithRetry', () => ({
  ...jest.requireActual('@/lib/fetchWithRetry'),
  fetchWithRetry: jest.fn(),
}))

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
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { rausername: 'Ivan' } } })

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
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { rausername: 'Ivan' } } })

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
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { rausername: 'Ivan' } } })

  const { result } = renderHook(() => useRecentlyPlayedGames(), { wrapper })
  await waitFor(() => expect(result.current.games).toEqual(games))

  act(() => result.current.refetch())
  expect(result.current.games).toEqual([])
  await waitFor(() => expect(result.current.games).toEqual(games))
  expect(fetchWithRetry).toHaveBeenCalledTimes(2)
})

test('never calls the RA endpoint without a linked RA account', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: {} } })
  const { result } = renderHook(() => useRecentlyPlayedGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).not.toHaveBeenCalled()
})

describe('as the session changes', () => {
  const signedIn = { status: 'authenticated', data: { user: { rausername: 'Ivan' } } }
  const games = [{ GameID: 1, Title: 'Sly Cooper' }]

  test('signing out empties the list, and signing in again loads it again', async () => {
    ;(fetchWithRetry as jest.Mock).mockResolvedValue(games)
    ;(useSession as jest.Mock).mockReturnValue(signedIn)
    const { result, rerender } = renderHook(() => useRecentlyPlayedGames(), { wrapper })
    await waitFor(() => expect(result.current.games).toEqual(games))

    ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
    rerender()
    expect(result.current.games).toEqual([])
    expect(result.current.isLoading).toBe(false)

    ;(useSession as jest.Mock).mockReturnValue(signedIn)
    rerender()
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.games).toEqual(games))
    expect(fetchWithRetry).toHaveBeenCalledTimes(2)
  })

  test('signed in with no RA account there is nothing to wait for or to ask', () => {
    ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { rausername: null } } })
    const { result } = renderHook(() => useRecentlyPlayedGames(), { wrapper })
    expect(result.current.isLoading).toBe(false)
    expect(fetchWithRetry).not.toHaveBeenCalled()
  })

  test('refetch empties the list, shows loading, and asks again', async () => {
    ;(fetchWithRetry as jest.Mock).mockResolvedValue(games)
    ;(useSession as jest.Mock).mockReturnValue(signedIn)
    const { result } = renderHook(() => useRecentlyPlayedGames(), { wrapper })
    await waitFor(() => expect(result.current.games).toEqual(games))

    act(() => result.current.refetch())
    expect(result.current.games).toEqual([])
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.games).toEqual(games))
    expect(fetchWithRetry).toHaveBeenCalledTimes(2)
  })

  test('a list that is not a list is retried, then reported as an error', async () => {
    jest.useFakeTimers()
    ;(fetchWithRetry as jest.Mock).mockResolvedValue({ not: 'a list' })
    ;(useSession as jest.Mock).mockReturnValue(signedIn)
    const { result } = renderHook(() => useRecentlyPlayedGames(), { wrapper })
    for (let i = 0; i < 6; i++) await act(async () => { await jest.advanceTimersByTimeAsync(30_000) })
    expect(result.current.error).toBe(true)
    expect(result.current.isLoading).toBe(false)
    jest.useRealTimers()
  })
})

test('session.update() flips the status to loading and back: a finished load is not started again, nor left loading', async () => {
  const games = [{ GameID: 1, Title: 'Sly Cooper' }]
  const signedIn = { status: 'authenticated', data: { user: { rausername: 'Ivan' } } }
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(games)
  ;(useSession as jest.Mock).mockReturnValue(signedIn)
  const { result, rerender } = renderHook(() => useRecentlyPlayedGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  ;(useSession as jest.Mock).mockReturnValue({ ...signedIn, status: 'loading' })
  rerender()
  ;(useSession as jest.Mock).mockReturnValue(signedIn)
  rerender()

  expect(result.current.isLoading).toBe(false)
  expect(result.current.games).toEqual(games)
  expect(fetchWithRetry).toHaveBeenCalledTimes(1)
})
