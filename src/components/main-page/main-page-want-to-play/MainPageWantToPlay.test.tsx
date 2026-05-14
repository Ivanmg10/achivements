jest.mock('@/hooks/useWantGamesPreview', () => ({
  useWantGamesPreview: jest.fn(),
}))

jest.mock('@/hooks/useResizableList', () => ({
  useResizableList: () => 5,
}))

jest.mock('@/components/main-page/main-page-games/main-page-games-list/MainPageGamesList', () => ({
  __esModule: true,
  default: ({ listGames }: { listGames: { GameTitle: string }[] }) => (
    <div>{(listGames ?? []).map((g) => <span key={g.GameTitle}>{g.GameTitle}</span>)}</div>
  ),
}))

jest.mock('@/components/main-page/console-side-list/ConsoleSideList', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/ui/GameCardSkeleton', () => ({
  GameCardSkeleton: () => <div data-testid="skeleton" />,
}))

jest.mock('@/components/empty-state/EmptyState', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div>{title}</div>,
}))

import { render, screen } from '@testing-library/react'
import MainPageWantToPlay from './MainPageWantToPlay'
import { useWantGamesPreview } from '@/hooks/useWantGamesPreview'

const mockGame = { ID: 1, GameTitle: 'Pokémon Emerald', ConsoleID: 5, ConsoleName: 'GBA', ImageIcon: '/icon.png' }

beforeEach(() => {
  ;(useWantGamesPreview as jest.Mock).mockReturnValue({ wantGames: [mockGame], loading: false })
})

test('renders want to play header', () => {
  render(<MainPageWantToPlay />)
  expect(screen.getByText('Want to play')).toBeInTheDocument()
})

test('renders want-to-play games', () => {
  render(<MainPageWantToPlay />)
  expect(screen.getByText('Pokémon Emerald')).toBeInTheDocument()
})

test('renders empty state when no games', () => {
  ;(useWantGamesPreview as jest.Mock).mockReturnValue({ wantGames: [], loading: false })
  render(<MainPageWantToPlay />)
  expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument()
})

test('shows skeletons when loading', () => {
  ;(useWantGamesPreview as jest.Mock).mockReturnValue({ wantGames: [], loading: true })
  render(<MainPageWantToPlay />)
  expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
})
