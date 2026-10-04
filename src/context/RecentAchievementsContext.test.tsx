import { render, waitFor } from '@testing-library/react'
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
