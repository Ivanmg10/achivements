import { render, screen, waitFor } from '@testing-library/react'
import { RARecentlyPlayedExpanded } from './RARecentlyPlayedExpanded'
import { RecentlyPlayedGame, RetroAchievement } from '@/types/types'

global.fetch = jest.fn()

const game: RecentlyPlayedGame = {
  GameID: 1,
  Title: 'Sly Cooper',
  ImageIcon: '/icon.png',
  ConsoleName: 'PS2',
  LastPlayed: '2024-01-15 20:30:00',
  NumPossibleAchievements: 10,
  PossibleScore: 100,
  NumAchieved: 4,
  ScoreAchieved: 40,
  NumAchievedHardcore: 2,
  ScoreAchievedHardcore: 20,
}

const recentDate = new Date().toISOString().replace('T', ' ').slice(0, 19)

const achievement: RetroAchievement = {
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
  DateEarned: recentDate,
  DateEarnedHardcore: recentDate,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] })
})

test('renders the circular ring, progress chart and achievement grid for the game', async () => {
  render(
    <RARecentlyPlayedExpanded
      game={game}
      achievements={[achievement]}
      numDistinctPlayers={5}
      isLoading={false}
    />,
  )
  expect(screen.getByRole('img', { name: /4 \/ 10/ })).toBeInTheDocument()
  expect(screen.getByTestId('ResponsiveContainer')).toBeInTheDocument()
  await waitFor(() => expect(screen.getByAltText('First blood')).toBeInTheDocument())
})

test('passes an empty achievement list to the grid while loading', () => {
  const { container } = render(
    <RARecentlyPlayedExpanded game={game} achievements={[achievement]} numDistinctPlayers={5} isLoading />,
  )
  expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
})
