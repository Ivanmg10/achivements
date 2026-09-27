import { render, renderHook, act, screen, waitFor } from '@testing-library/react'
import { ActivityHeatmapYearProvider, useActivityHeatmapYear } from './ActivityHeatmapYearContext'
import { useSession } from 'next-auth/react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@/hooks/useSteamRecentAchievements', () => ({ useSteamRecentAchievements: jest.fn() }))
jest.mock('@/lib/fetchWithRetry', () => ({
  ...jest.requireActual('@/lib/fetchWithRetry'),
  fetchWithRetry: jest.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ActivityHeatmapYearProvider>{children}</ActivityHeatmapYearProvider>
)

const steamYear = (achievements: unknown[] = [], extra: Record<string, unknown> = {}) =>
  (useSteamRecentAchievements as jest.Mock).mockReturnValue({
    achievements, isLoading: false, error: null, retry: jest.fn(), ...extra,
  })

beforeEach(() => {
  jest.clearAllMocks()
  steamYear()
})

test('does not fetch when there is no linked RA username', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { rausername: null } } })
  const { result } = renderHook(() => useActivityHeatmapYear(), { wrapper })

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).not.toHaveBeenCalled()
})

test('fetches once when a rausername is present', async () => {
  const achievements = [{ AchievementID: 1, Date: '2024-01-01' }]
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(achievements)
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { rausername: 'ivan' } } })

  const { result } = renderHook(() => useActivityHeatmapYear(), { wrapper })

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getActivityHeatmapYear')
  expect(result.current.achievements).toEqual(achievements)
})

test('shares a single fetch across multiple consumers under the same provider', async () => {
  const achievements = [{ AchievementID: 1, Date: '2024-01-01' }]
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(achievements)
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { rausername: 'ivan' } } })

  function Consumer({ testId }: { testId: string }) {
    const { achievements } = useActivityHeatmapYear()
    return <span data-testid={testId}>{achievements.length}</span>
  }

  render(
    <ActivityHeatmapYearProvider>
      <Consumer testId="header" />
      <Consumer testId="streak-page" />
    </ActivityHeatmapYearProvider>
  )

  await waitFor(() => expect(screen.getByTestId('header')).toHaveTextContent('1'))
  expect(screen.getByTestId('streak-page')).toHaveTextContent('1')
  expect(fetchWithRetry).toHaveBeenCalledTimes(1)
})

test('refetch clears achievements and fetches again', async () => {
  const achievements = [{ AchievementID: 1, Date: '2024-01-01' }]
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(achievements)
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { rausername: 'ivan' } } })

  const { result } = renderHook(() => useActivityHeatmapYear(), { wrapper })
  await waitFor(() => expect(result.current.achievements).toEqual(achievements))

  act(() => result.current.refetch())
  expect(result.current.achievements).toEqual([])
  await waitFor(() => expect(result.current.achievements).toEqual(achievements))
  expect(fetchWithRetry).toHaveBeenCalledTimes(2)
})

const STEAM_UNLOCK = {
  appId: 620, gameTitle: 'Portal 2', apiname: 'WIN', title: 'Win',
  badgeUrl: 'https://cdn/win.jpg', unlockedAt: '2024-01-02T10:00:00', globalPct: 12,
}

test('a Steam-only account still gets its year — the streak is not RA only', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { steamid: '765' } } })
  steamYear([STEAM_UNLOCK])

  const { result } = renderHook(() => useActivityHeatmapYear(), { wrapper })

  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetchWithRetry).not.toHaveBeenCalled()
  expect(useSteamRecentAchievements).toHaveBeenCalledWith('year')
  expect(result.current.achievements).toHaveLength(1)
  expect(result.current.achievements[0]).toMatchObject({ GameID: 620, Source: 'steam', Title: 'Win' })
})

test('asks Steam for nothing when no Steam account is linked', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { rausername: 'ivan' } } })
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([])
  renderHook(() => useActivityHeatmapYear(), { wrapper })
  await waitFor(() => expect(useSteamRecentAchievements).toHaveBeenCalledWith(null))
})

test('both platforms land in one list, newest first', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { rausername: 'ivan', steamid: '765' } } })
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([{ AchievementID: 1, Date: '2024-01-01 12:00:00' }])
  steamYear([STEAM_UNLOCK])

  const { result } = renderHook(() => useActivityHeatmapYear(), { wrapper })

  await waitFor(() => expect(result.current.achievements).toHaveLength(2))
  expect(result.current.achievements.map((a) => a.Date)).toEqual([
    '2024-01-02 10:00:00',
    '2024-01-01 12:00:00',
  ])
})

test('Steam failing does not hide the RA year', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { rausername: 'ivan', steamid: '765' } } })
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([{ AchievementID: 1, Date: '2024-01-01 12:00:00' }])
  steamYear([], { error: 'Steam down' })

  const { result } = renderHook(() => useActivityHeatmapYear(), { wrapper })

  await waitFor(() => expect(result.current.achievements).toHaveLength(1))
  expect(result.current.error).toBe(false)
})

test('an error only when nothing came back from anywhere', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user: { rausername: 'ivan', steamid: '765' } } })
  ;(fetchWithRetry as jest.Mock).mockRejectedValue(Object.assign(new Error('nope'), { status: 400 }))
  steamYear([], { error: 'Steam down' })

  const { result } = renderHook(() => useActivityHeatmapYear(), { wrapper })

  await waitFor(() => expect(result.current.error).toBe(true))
})
