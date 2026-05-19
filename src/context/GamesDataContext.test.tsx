import { renderHook, act, waitFor } from '@testing-library/react'
import { GamesDataProvider, useGamesData } from './GamesDataContext'
import { useSession } from 'next-auth/react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn() }))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GamesDataProvider>{children}</GamesDataProvider>
)

beforeEach(() => {
  jest.clearAllMocks()
})

test('does not fetch when rausername is null, sets isLoading false', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { id: '1', rausername: null } }, status: 'authenticated' })

  const { result } = renderHook(() => useGamesData(), { wrapper })

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).not.toHaveBeenCalled()
  expect(result.current.all).toEqual([])
})

test('fetches games when rausername is present', async () => {
  const games = [{ GameID: 1, ConsoleID: 1, HardcoreMode: '1', PctWon: '1' }]
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(games)
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { id: '1', rausername: 'testuser' } }, status: 'authenticated' })

  const { result } = renderHook(() => useGamesData(), { wrapper })

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getGamesCompleted')
  expect(result.current.all).toHaveLength(1)
})

test('fetches when rausername changes from null to value', async () => {
  const games = [{ GameID: 2, ConsoleID: 1, HardcoreMode: '0', PctWon: '0.5' }]
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(games)

  const sessionMock = { data: { user: { id: '1', rausername: null as string | null } }, status: 'authenticated' }
  ;(useSession as jest.Mock).mockReturnValue(sessionMock)

  const { result, rerender } = renderHook(() => useGamesData(), { wrapper })

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).not.toHaveBeenCalled()

  // Simulate user linking RA account — session updates with rausername
  act(() => {
    ;(useSession as jest.Mock).mockReturnValue({ data: { user: { id: '1', rausername: 'newuser' } }, status: 'authenticated' })
  })
  rerender()

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getGamesCompleted')
  expect(result.current.all).toHaveLength(1)
})

test('clears data and resets on unauthenticated', async () => {
  const games = [{ GameID: 1, ConsoleID: 1, HardcoreMode: '1', PctWon: '1' }]
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(games)
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { id: '1', rausername: 'user' } }, status: 'authenticated' })

  const { result, rerender } = renderHook(() => useGamesData(), { wrapper })

  await waitFor(() => expect(result.current.all).toHaveLength(1))

  act(() => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' })
  })
  rerender()

  await waitFor(() => expect(result.current.all).toEqual([]))
  expect(result.current.isLoading).toBe(false)
})
