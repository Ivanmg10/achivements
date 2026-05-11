import { render, screen } from '@testing-library/react'
import StatusGameList from './StatusGameList'

jest.mock('./StatusGameItem', () => ({
  __esModule: true,
  default: ({ game }: { game: { GameTitle: string } }) => <div>{game.GameTitle}</div>,
}))

const mockGames = [
  { GameID: 1, GameTitle: 'Sly Cooper', ConsoleID: 21, ConsoleName: 'PS2', ImageIcon: '/icon.png', NumAchievements: 10, NumAchievedHardcore: 5, PctWon: '0.5' },
  { GameID: 2, GameTitle: 'Jak 2', ConsoleID: 21, ConsoleName: 'PS2', ImageIcon: '/icon2.png', NumAchievements: 20, NumAchievedHardcore: 20, PctWon: '1.0' },
] as any[]

test('renders list of games', () => {
  render(<StatusGameList games={mockGames} />)
  expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
  expect(screen.getByText('Jak 2')).toBeInTheDocument()
})

test('renders without crashing with empty list', () => {
  const { container } = render(<StatusGameList games={[]} />)
  expect(container.firstChild).toBeInTheDocument()
})
