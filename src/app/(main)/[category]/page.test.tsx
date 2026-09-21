jest.mock('@/components/steam/steam-category-section/SteamCategorySection', () => ({
  __esModule: true,
  default: ({ category }: { category: string }) => <div data-testid="steam-section">{category}</div>,
}))

jest.mock('@/context/SteamGamesDataContext', () => ({
  useSteamGamesData: jest.fn(() => ({ isLinked: false })),
}))

jest.mock('../../../hooks/useGamesByCategory', () => ({
  useGamesByCategory: jest.fn(),
}))

jest.mock('../../../hooks/useGameExtraData', () => ({
  useGameExtraData: jest.fn(() => ({})),
}))

jest.mock('../../../hooks/useConsoleFilter', () => ({
  useConsoleFilter: jest.fn(() => ({ selected: new Set(), toggle: jest.fn(), clear: jest.fn() })),
}))

jest.mock('../../../hooks/useGameFiltering', () => ({
  useGameFiltering: jest.fn((args: { games: unknown[] }) => args.games ?? []),
}))

jest.mock('../../../components/statusGameList/StatusGameList', () => ({
  __esModule: true,
  default: ({ games }: { games: { GameTitle: string }[] }) => (
    <div data-testid="game-list">{games.map((g) => g.GameTitle).join(',')}</div>
  ),
}))

jest.mock('../../../components/status-page-header/StatusPageHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="status-header" />,
}))

jest.mock('../../../components/completed-filter/CompletedFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="completed-filter" />,
}))

jest.mock('@/components/console-filter/ConsoleFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="console-filter" />,
  buildConsolePills: jest.fn(() => []),
}))

jest.mock('../../../components/empty-state/EmptyState', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}))

jest.mock('../../../components/loading-page/LoadingPage', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-page" />,
}))

import { render, screen } from '@testing-library/react'
import CategoryPage from './page'
import { useParams } from 'next/navigation'
import { useGamesByCategory } from '../../../hooks/useGamesByCategory'
import { useGameFiltering } from '../../../hooks/useGameFiltering'
import { useSession } from 'next-auth/react'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'

const mockGames = [
  { GameID: 1, GameTitle: 'Sly Cooper', ConsoleID: 21, ConsoleName: 'PS2', ImageIcon: '/icon.png', NumAchievements: 10, NumAchievedHardcore: 5, PctWon: '0.5' },
]

beforeEach(() => {
  ;(useParams as jest.Mock).mockReturnValue({ category: 'playing' })
})

test('renders loading state', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: true, error: null })
  render(<CategoryPage />)
  expect(screen.getByTestId('loading-page')).toBeInTheDocument()
})

test('renders game list when games exist', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: null })
  render(<CategoryPage />)
  expect(screen.getByTestId('game-list')).toBeInTheDocument()
  expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
})

test('renders empty state when no games', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: null })
  render(<CategoryPage />)
  expect(screen.getByTestId('empty-state')).toBeInTheDocument()
})

test('renders error message on fetch error', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: 'Network error' })
  render(<CategoryPage />)
  expect(screen.getByText('Network error')).toBeInTheDocument()
})

test('passes a default lastPlayed sort state for playing/completed categories', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: null })
  render(<CategoryPage />)
  expect(useGameFiltering).toHaveBeenCalledWith(
    expect.objectContaining({ sortState: { key: 'lastPlayed', dir: 'desc' } }),
  )
})

test('passes a default name sort state for the want-to-play category', () => {
  ;(useParams as jest.Mock).mockReturnValue({ category: 'wantToPlay' })
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: null })
  render(<CategoryPage />)
  expect(useGameFiltering).toHaveBeenCalledWith(
    expect.objectContaining({ sortState: { key: 'name', dir: 'asc' } }),
  )
})

describe('Steam section', () => {
  function asUser(user: Record<string, unknown>, steamLinked: boolean) {
    ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: jest.fn() })
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: steamLinked })
  }

  afterEach(() => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated', update: jest.fn() })
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false })
  })

  test('follows the RA list for the same category', () => {
    asUser({ raUser: { User: 'Ivan' } }, true)
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: undefined })
    render(<CategoryPage />)

    const list = screen.getByTestId('game-list')
    const steam = screen.getByTestId('steam-section')
    expect(steam).toHaveTextContent('playing')
    expect(list.compareDocumentPosition(steam) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('waits for the RA list rather than showing under a loading page', () => {
    asUser({ raUser: { User: 'Ivan' } }, true)
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: true, error: undefined })
    render(<CategoryPage />)
    expect(screen.queryByTestId('steam-section')).not.toBeInTheDocument()
  })

  test('a Steam-only user sees only Steam — no RA empty state telling them to play on RA', () => {
    asUser({ steamid: '765' }, true)
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: undefined })
    render(<CategoryPage />)

    expect(screen.getByTestId('steam-section')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    expect(screen.queryByTestId('loading-page')).not.toBeInTheDocument()
  })

  test('a Steam-only user is not held up by the RA loading state', () => {
    asUser({ steamid: '765' }, true)
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: true, error: undefined })
    render(<CategoryPage />)
    expect(screen.getByTestId('steam-section')).toBeInTheDocument()
  })

  test('with neither account the RA page is unchanged', () => {
    asUser({}, false)
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: undefined })
    render(<CategoryPage />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })
})
