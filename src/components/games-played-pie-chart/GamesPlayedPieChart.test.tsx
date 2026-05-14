import { render, screen } from '@testing-library/react'
import GamesPlayedPieChart from './GamesPlayedPieChart'

const mockGames = [
  { ConsoleName: 'PS2', GameID: 1, HardcoreMode: '0', PctWon: '1.0000' } as any,
  { ConsoleName: 'PS2', GameID: 2, HardcoreMode: '0', PctWon: '0.5000' } as any,
  { ConsoleName: 'GBA', GameID: 3, HardcoreMode: '0', PctWon: '1.0000' } as any,
]

test('renders bar chart with games', () => {
  const { container } = render(<GamesPlayedPieChart games={mockGames} />)
  expect(container.firstChild).toBeInTheDocument()
})

test('renders empty state when no games', () => {
  render(<GamesPlayedPieChart games={[]} />)
  expect(screen.getByText('No data')).toBeInTheDocument()
})

test('renders loading skeleton when isLoading', () => {
  const { container } = render(<GamesPlayedPieChart games={[]} isLoading={true} />)
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
})
