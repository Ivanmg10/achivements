jest.mock('@/hooks/useGamesProgressionList', () => ({
  useGamesProgressionList: jest.fn(),
}))

jest.mock('@/components/main-page/main-page-progression/main-page-progression-card/MainPageProgressionCard', () => ({
  __esModule: true,
  default: ({ game }: { game: { GameTitle: string } }) => <div>{game.GameTitle}</div>,
}))

import { render, screen } from '@testing-library/react'
import MainPageProgression from './MainPageProgression'
import { useGamesProgressionList } from '@/hooks/useGamesProgressionList'

const mockGame = { ID: 1, GameTitle: 'Sly Cooper', ConsoleName: 'PS2', ImageIcon: '/icon.png', UserCompletion: '50%' }

beforeEach(() => {
  ;(useGamesProgressionList as jest.Mock).mockReturnValue([mockGame])
})

test('renders progression section header', () => {
  render(<MainPageProgression />)
  expect(screen.getByText('Your recent progress')).toBeInTheDocument()
})

test('renders games', () => {
  render(<MainPageProgression />)
  expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
})

test('renders with empty games list', () => {
  ;(useGamesProgressionList as jest.Mock).mockReturnValue([])
  render(<MainPageProgression />)
  expect(screen.getByText('Your recent progress')).toBeInTheDocument()
})
