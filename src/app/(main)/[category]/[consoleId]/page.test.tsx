jest.mock('../../../../hooks/useGamesByCategory', () => ({
  useGamesByCategory: jest.fn(),
}))

jest.mock('../../../../hooks/useGameExtraData', () => ({
  useGameExtraData: jest.fn(() => ({})),
}))

jest.mock('../../../../hooks/useConsoleFilter', () => ({
  useConsoleFilter: jest.fn(() => ({ selected: new Set(), toggle: jest.fn(), clear: jest.fn() })),
}))

jest.mock('../../../../hooks/useGameFiltering', () => ({
  useGameFiltering: jest.fn((args: { games: unknown[] }) => args.games ?? []),
}))

jest.mock('../../../../components/statusGameList/StatusGameList', () => ({
  __esModule: true,
  default: ({ games }: { games: { GameTitle: string }[] }) => (
    <div data-testid="game-list">{games.map((g) => g.GameTitle).join(',')}</div>
  ),
}))

jest.mock('../../../../components/status-page-header/StatusPageHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="status-header" />,
}))

jest.mock('../../../../components/completed-filter/CompletedFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="completed-filter" />,
}))

jest.mock('@/components/console-filter/ConsoleFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="console-filter" />,
  buildConsolePills: jest.fn(() => []),
}))

jest.mock('../../../../components/empty-state/EmptyState', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}))

jest.mock('../../../../components/loading-page/LoadingPage', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-page" />,
}))

import { render, screen } from '@testing-library/react'
import CategoryConsolePage from './page'
import { useParams } from 'next/navigation'
import { useGamesByCategory } from '../../../../hooks/useGamesByCategory'

const mockGames = [
  { GameID: 1, GameTitle: 'Sly Cooper', ConsoleID: 21, ConsoleName: 'PS2', ImageIcon: '/icon.png', NumAchievements: 10, NumAchievedHardcore: 5, PctWon: '0.5' },
]

beforeEach(() => {
  ;(useParams as jest.Mock).mockReturnValue({ category: 'playing', consoleId: '21' })
})

test('renders loading state', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: true, error: null })
  render(<CategoryConsolePage />)
  expect(screen.getByTestId('loading-page')).toBeInTheDocument()
})

test('renders game list when games exist', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: null })
  render(<CategoryConsolePage />)
  expect(screen.getByTestId('game-list')).toBeInTheDocument()
  expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
})

test('renders empty state when no games', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: null })
  render(<CategoryConsolePage />)
  expect(screen.getByTestId('empty-state')).toBeInTheDocument()
})

test('renders error message on fetch error', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: 'Network error' })
  render(<CategoryConsolePage />)
  expect(screen.getByText('Network error')).toBeInTheDocument()
})
