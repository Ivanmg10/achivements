import { render, renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { RecentAchievementsProvider, useRecentAchievements } from './RecentAchievementsContext'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@/lib/fetchWithRetry', () => ({
  ...jest.requireActual('@/lib/fetchWithRetry'),
  fetchWithRetry: jest.fn(),
}))

function Reader() {
  const { achievements } = useRecentAchievements()
  return <p>{achievements.length}</p>
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { rausername: 'Ivan' } } })
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([])
})

test('nothing is fetched on a page that never reads the list', () => {
  render(<RecentAchievementsProvider><p>game page</p></RecentAchievementsProvider>)
  expect(fetchWithRetry).not.toHaveBeenCalled()
})

test('the first reader starts the load, once', async () => {
  render(<RecentAchievementsProvider><Reader /><Reader /></RecentAchievementsProvider>)
  await waitFor(() => expect(fetchWithRetry).toHaveBeenCalledWith('/api/getRecentAchievements'))
  expect(fetchWithRetry).toHaveBeenCalledTimes(1)
})

describe('the list as the session changes', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <RecentAchievementsProvider>{children}</RecentAchievementsProvider>
  const signedIn = { status: 'authenticated', data: { user: { rausername: 'Ivan' } } }
  const entry = (n: number) => ({ Date: `2026-01-0${n} 10:00:00`, Title: `A${n}` })

  test('loads for a reader, newest first, and stops loading', async () => {
    ;(fetchWithRetry as jest.Mock).mockResolvedValue([entry(1), entry(3), entry(2)])
    const { result } = renderHook(() => useRecentAchievements(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.achievements.map((a) => a.Title)).toEqual(['A3', 'A2', 'A1'])
  })

  test('without an RA account it is not loading and asks nothing', async () => {
    ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { rausername: null } } })
    const { result } = renderHook(() => useRecentAchievements(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetchWithRetry).not.toHaveBeenCalled()
  })

  test('signing out empties the list', async () => {
    ;(fetchWithRetry as jest.Mock).mockResolvedValue([entry(1)])
    const { result, rerender } = renderHook(() => useRecentAchievements(), { wrapper })
    await waitFor(() => expect(result.current.achievements).toHaveLength(1))
    ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null })
    rerender()
    expect(result.current.achievements).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  test('refetch empties the list, shows loading, and asks again', async () => {
    ;(useSession as jest.Mock).mockReturnValue(signedIn)
    ;(fetchWithRetry as jest.Mock).mockResolvedValue([entry(1)])
    const { result } = renderHook(() => useRecentAchievements(), { wrapper })
    await waitFor(() => expect(result.current.achievements).toHaveLength(1))
    act(() => result.current.refetch())
    expect(result.current.achievements).toEqual([])
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.achievements).toHaveLength(1))
    expect(fetchWithRetry).toHaveBeenCalledTimes(2)
  })
})

describe('when session.update() flips the status', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <RecentAchievementsProvider>{children}</RecentAchievementsProvider>
  const signedIn = { status: 'authenticated', data: { user: { rausername: 'Ivan' } } }

  test('a finished load is not started again, nor left loading', async () => {
    ;(useSession as jest.Mock).mockReturnValue(signedIn)
    ;(fetchWithRetry as jest.Mock).mockResolvedValue([{ Date: '2026-01-01 10:00:00', Title: 'A' }])
    const { result, rerender } = renderHook(() => useRecentAchievements(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    ;(useSession as jest.Mock).mockReturnValue({ ...signedIn, status: 'loading' })
    rerender()
    ;(useSession as jest.Mock).mockReturnValue(signedIn)
    rerender()

    expect(result.current.isLoading).toBe(false)
    expect(result.current.achievements).toHaveLength(1)
    expect(fetchWithRetry).toHaveBeenCalledTimes(1)
  })
})
