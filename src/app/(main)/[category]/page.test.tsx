jest.mock('@/hooks/useSteamGamesByCategory', () => ({
  useSteamGamesByCategory: jest.fn(() => ({ games: [] })),
}))

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
  default: ({ gameCount }: { gameCount: number }) => <div data-testid="status-header">{gameCount}</div>,
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
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import { fireEvent } from '@testing-library/react'

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

describe('foldable RA and Steam sections', () => {
  function bothAccounts() {
    ;(useSession as jest.Mock).mockReturnValue({ data: { user: { raUser: { User: 'Ivan' } } }, status: 'authenticated', update: jest.fn() })
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: true })
    ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [{ id: 1 }, { id: 2 }] })
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: undefined })
  }

  beforeEach(() => window.localStorage.clear())

  afterEach(() => {
    ;(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated', update: jest.fn() })
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false })
    ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [] })
  })

  test('with both accounts the RA list sits in a section that folds away', () => {
    bothAccounts()
    render(<CategoryPage />)

    expect(screen.getByRole('region', { name: 'RetroAchievements' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /RetroAchievements/ }))

    expect(screen.queryByTestId('game-list')).not.toBeInTheDocument()
    // Steam is still right there.
    expect(screen.getByTestId('steam-section')).toBeInTheDocument()
  })

  test('remembers the RA section state per category', () => {
    bothAccounts()
    render(<CategoryPage />)
    fireEvent.click(screen.getByRole('button', { name: /RetroAchievements/ }))
    expect(window.localStorage.getItem('ra-section-open:playing')).toBe('closed')
  })

  test('the page count covers both platforms', () => {
    bothAccounts()
    render(<CategoryPage />)
    expect(screen.getByTestId('status-header')).toHaveTextContent('3')
  })

  test('the grid control stays outside the RA section, since it drives both lists', () => {
    bothAccounts()
    render(<CategoryPage />)
    const raSection = screen.getByRole('region', { name: 'RetroAchievements' })
    fireEvent.click(screen.getByRole('button', { name: /RetroAchievements/ }))
    // Folding RA must not take the grid control away from the Steam list.
    expect(screen.getByTestId('status-header')).toBeInTheDocument()
    expect(raSection.contains(screen.getByTestId('status-header'))).toBe(false)
  })

  test('without Steam there is no fold — the RA page is as before', () => {
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: undefined })
    render(<CategoryPage />)
    expect(screen.queryByRole('region', { name: 'RetroAchievements' })).not.toBeInTheDocument()
    expect(screen.getByTestId('game-list')).toBeInTheDocument()
  })

  test('an empty RA list keeps the Steam section close by', () => {
    bothAccounts()
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: undefined })
    render(<CategoryPage />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByTestId('steam-section')).toBeInTheDocument()
  })
})
