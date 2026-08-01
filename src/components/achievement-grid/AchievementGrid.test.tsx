import { render, screen, act, fireEvent } from '@testing-library/react'
import { AchievementGrid } from './AchievementGrid'
import { RetroAchievement } from '@/types/types'

jest.mock('@/components/achievement-modal/AchievementModal', () => ({
  __esModule: true,
  default: ({ achievement, onClose }: { achievement: RetroAchievement; onClose: () => void }) => (
    <div data-testid="achievement-modal">
      <span>{achievement.Title}</span>
      <button onClick={onClose}>close</button>
    </div>
  ),
}))

global.fetch = jest.fn()

const earnedAchievement: RetroAchievement = {
  ID: 1,
  NumAwarded: 10,
  NumAwardedHardcore: 5,
  Title: 'First blood',
  Description: 'Earn your first point',
  Points: 10,
  TrueRatio: 10,
  Author: 'someone',
  AuthorULID: 'a',
  DateModified: '2024-01-01',
  DateCreated: '2024-01-01',
  BadgeName: 'badge1',
  DisplayOrder: 0,
  MemAddr: '0x00',
  Type: 'progression',
  DateEarned: '2024-02-01',
  DateEarnedHardcore: '2024-02-01',
}

const unearnedAchievement: RetroAchievement = {
  ...earnedAchievement,
  ID: 2,
  Title: 'Second win',
  Type: null,
  DateEarned: null,
  DateEarnedHardcore: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/favorites')) {
      return Promise.resolve({ ok: true, json: async () => [] })
    }
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
})

test('renders a total-based skeleton when there are no achievements yet', () => {
  const { container } = render(
    <AchievementGrid achievements={[]} total={5} gameId={1} gameTitle="Game" numDistinctPlayers={1} />,
  )
  expect(container.querySelectorAll('.animate-pulse').length).toBe(5)
})

test('renders the badge grid once achievements are provided', async () => {
  jest.useFakeTimers()
  render(
    <AchievementGrid
      achievements={[earnedAchievement, unearnedAchievement]}
      total={2}
      gameId={1}
      gameTitle="Game"
      numDistinctPlayers={3}
    />,
  )
  await act(async () => {
    jest.advanceTimersByTime(1500)
  })
  expect(screen.getByAltText('First blood')).toBeInTheDocument()
  expect(screen.getByAltText('Second win')).toBeInTheDocument()
  jest.useRealTimers()
})

test('fetches favorited achievements for the game', () => {
  render(
    <AchievementGrid achievements={[earnedAchievement]} total={1} gameId={7} gameTitle="Game" numDistinctPlayers={1} />,
  )
  expect(fetch).toHaveBeenCalledWith('/api/favorites?gameId=7')
})

test('opens the achievement modal on click', async () => {
  jest.useFakeTimers()
  render(
    <AchievementGrid achievements={[earnedAchievement]} total={1} gameId={1} gameTitle="Game" numDistinctPlayers={1} />,
  )
  await act(async () => {
    jest.advanceTimersByTime(1500)
  })
  jest.useRealTimers()

  fireEvent.click(screen.getByAltText('First blood').closest('div')!)
  expect(screen.getByTestId('achievement-modal')).toBeInTheDocument()

  fireEvent.click(screen.getByText('close'))
  expect(screen.queryByTestId('achievement-modal')).not.toBeInTheDocument()
})

test('shows a tooltip with type badge after hovering', async () => {
  jest.useFakeTimers()
  render(
    <AchievementGrid achievements={[earnedAchievement]} total={1} gameId={1} gameTitle="Game" numDistinctPlayers={1} />,
  )
  await act(async () => {
    jest.advanceTimersByTime(1500)
  })

  const badge = screen.getByAltText('First blood').closest('div')!
  fireEvent.mouseEnter(badge, { clientX: 10, clientY: 20 })
  act(() => {
    jest.advanceTimersByTime(450)
  })
  expect(screen.getByText('Earn your first point')).toBeInTheDocument()

  fireEvent.mouseLeave(badge)
  jest.useRealTimers()
})
