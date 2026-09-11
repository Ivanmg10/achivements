import { render, renderHook, act, screen, waitFor } from '@testing-library/react'
import { ActivityHeatmapYearProvider, useActivityHeatmapYear } from './ActivityHeatmapYearContext'
import { useSession } from 'next-auth/react'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn() }))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ActivityHeatmapYearProvider>{children}</ActivityHeatmapYearProvider>
)

beforeEach(() => {
  jest.clearAllMocks()
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
