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

jest.mock('@/hooks/useGamesByCategory', () => ({
  useGamesByCategory: jest.fn(),
}))

jest.mock('@/hooks/useGameExtraData', () => ({
  useGameExtraData: jest.fn(() => new Map()),
}))

jest.mock('@/hooks/useConsoleFilter', () => ({
  useConsoleFilter: jest.fn(() => ({ selected: new Set(), toggle: jest.fn(), clear: jest.fn() })),
}))

jest.mock('@/hooks/useGameFiltering', () => ({
  useGameFiltering: jest.fn((args: { games: unknown[] }) => args.games ?? []),
}))

jest.mock('@/components/statusGameList/StatusGameList', () => ({
  __esModule: true,
  default: ({ games }: { games: { GameTitle: string }[] }) => (
    <div data-testid="game-list">{games.map((g) => g.GameTitle).join(',')}</div>
  ),
}))

jest.mock('@/components/status-page-header/StatusPageHeader', () => ({
  __esModule: true,
  default: ({ gameCount, children }: { gameCount: number; children?: React.ReactNode }) => (
    <div data-testid="status-header">
      {gameCount}
      {children}
    </div>
  ),
}))

jest.mock('@/components/completed-filter/CompletedFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="completed-filter" />,
}))

jest.mock('@/components/console-filter/ConsoleFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="console-filter" />,
  buildConsolePills: jest.fn(() => []),
}))

jest.mock('@/components/empty-state/EmptyState', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}))

jest.mock('@/components/status-page-skeleton/StatusPageSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-page" />,
}))

jest.mock('@/components/library-all-list/LibraryAllList', () => ({
  __esModule: true,
  default: ({ entries }: { entries: { key: string; title: string }[] }) => (
    <ul>{entries.map((e) => <li key={e.key} data-testid="mixed-item">{e.title}</li>)}</ul>
  ),
}))

jest.mock('@/components/library-explorer/LibraryExplorer', () => ({
  __esModule: true,
  default: ({ layout, entries, onLayout }: { layout: string; entries: { key: string }[]; onLayout: (l: string) => void }) => (
    <div data-testid="explorer" data-layout={layout}>
      {entries.map((e) => e.key).join(',')}
      <button onClick={() => onLayout('list')}>to-list</button>
    </div>
  ),
}))

jest.mock('@/hooks/useRaLinked', () => ({ useRaLinked: jest.fn() }))

import { render, screen } from '@testing-library/react'
import CategoryPage from './page'
import { useParams } from 'next/navigation'
import { useGamesByCategory } from '@/hooks/useGamesByCategory'
import { useGameFiltering } from '@/hooks/useGameFiltering'
import { useRaLinked } from '@/hooks/useRaLinked'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import { fireEvent } from '@testing-library/react'
import { en } from '@/translations/en'

/** The page opens on its shelves; most of these tests are about the cards, so go there first. */
function renderCards() {
  const view = render(<CategoryPage />)
  const cards = screen.queryByRole('button', { name: 'Cards' })
  if (cards) fireEvent.click(cards)
  return view
}

const mockGames = [
  { GameID: 1, GameTitle: 'Sly Cooper', ConsoleID: 21, ConsoleName: 'PS2', ImageIcon: '/icon.png', NumAchievements: 10, NumAchievedHardcore: 5, PctWon: '0.5' },
]

beforeEach(() => {
  // The layout is remembered in the browser: every test starts from a clean one.
  localStorage.clear()
  ;(useParams as jest.Mock).mockReturnValue({ category: 'playing' })
  ;(useRaLinked as jest.Mock).mockReturnValue(true)
})

test('renders loading state: the skeleton of the shelves it opens on', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: true, error: null })
  render(<CategoryPage />)
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  expect(screen.queryByTestId('loading-page')).not.toBeInTheDocument()
})

test('renders game list when games exist', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: null })
  renderCards()
  expect(screen.getByTestId('game-list')).toBeInTheDocument()
  expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
})

test('renders empty state when no games', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: null })
  renderCards()
  expect(screen.getByTestId('empty-state')).toBeInTheDocument()
})

test('renders error message on fetch error', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: 'Network error' })
  renderCards()
  expect(screen.getByText('Network error')).toBeInTheDocument()
})

test('a Steam profile that turned private says so, and any other Steam failure is the generic one', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: null })
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: true })
  ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [], error: 'private' })
  const { unmount } = render(<CategoryPage />)
  expect(screen.getByText(new RegExp(en.steamLink.errors.private.slice(0, 20)))).toBeInTheDocument()
  unmount()
  ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [], error: 'Steam request failed (503)' })
  render(<CategoryPage />)
  expect(screen.getByText(new RegExp(en.steam.gamesError))).toBeInTheDocument()
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false })
  ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [] })
})

test('passes a default lastPlayed sort state for playing/completed categories', () => {
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: null })
  renderCards()
  expect(useGameFiltering).toHaveBeenCalledWith(
    expect.objectContaining({ sortState: { key: 'lastPlayed', dir: 'desc' } }),
  )
})

test('passes a default name sort state for the want-to-play category', () => {
  ;(useParams as jest.Mock).mockReturnValue({ category: 'wantToPlay' })
  ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: null })
  renderCards()
  expect(useGameFiltering).toHaveBeenCalledWith(
    expect.objectContaining({ sortState: { key: 'name', dir: 'asc' } }),
  )
})

describe('Steam section', () => {
  function asUser(raLinked: boolean, steamLinked: boolean) {
    ;(useRaLinked as jest.Mock).mockReturnValue(raLinked)
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: steamLinked })
  }

  afterEach(() => {
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false })
  })

  test('follows the RA list for the same category', () => {
    asUser(true, true)
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: undefined })
    window.sessionStorage.setItem('ra-section-open:playing', 'open')
    renderCards()

    const list = screen.getByTestId('game-list')
    const steam = screen.getByTestId('steam-section')
    expect(steam).toHaveTextContent('playing')
    expect(list.compareDocumentPosition(steam) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('waits for the RA list rather than showing under a loading page', () => {
    asUser(true, true)
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: true, error: undefined })
    renderCards()
    expect(screen.queryByTestId('steam-section')).not.toBeInTheDocument()
  })

  test('a Steam-only user sees only Steam — no RA empty state telling them to play on RA', () => {
    asUser(false, true)
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: undefined })
    renderCards()

    expect(screen.getByTestId('steam-section')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    expect(screen.queryByTestId('loading-page')).not.toBeInTheDocument()
  })

  test('a Steam-only user is not held up by the RA loading state', () => {
    asUser(false, true)
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: true, error: undefined })
    renderCards()
    expect(screen.getByTestId('steam-section')).toBeInTheDocument()
  })

  test('with no RA account there is no RA section at all, not even an empty one', () => {
    asUser(false, false)
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: undefined })
    renderCards()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
    expect(screen.queryByTestId('game-list')).not.toBeInTheDocument()
    expect(screen.getByTestId('steam-section')).toBeInTheDocument()
  })
})

describe('foldable RA and Steam sections', () => {
  function bothAccounts() {
    ;(useRaLinked as jest.Mock).mockReturnValue(true)
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: true })
    ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [{ id: 1 }, { id: 2 }] })
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: undefined })
  }

  beforeEach(() => window.sessionStorage.clear())

  afterEach(() => {
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false })
    ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [] })
  })

  test('with both accounts the RA list sits in a section that starts folded', () => {
    bothAccounts()
    renderCards()

    expect(screen.getByRole('region', { name: 'RetroAchievements' })).toBeInTheDocument()
    expect(screen.queryByTestId('game-list')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /RetroAchievements/ }))
    expect(screen.getByTestId('game-list')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /RetroAchievements/ }))
    expect(screen.queryByTestId('game-list')).not.toBeInTheDocument()
    // Steam is still right there.
    expect(screen.getByTestId('steam-section')).toBeInTheDocument()
  })

  test('remembers the RA section state per category for the session', () => {
    bothAccounts()
    renderCards()
    fireEvent.click(screen.getByRole('button', { name: /RetroAchievements/ }))
    expect(window.sessionStorage.getItem('ra-section-open:playing')).toBe('open')
  })

  test('folded, the RA section previews its first games', () => {
    bothAccounts()
    renderCards()
    const links = screen.getByRole('region', { name: 'RetroAchievements' }).querySelectorAll('a[href^="/gameInfo/"]')
    expect(links.length).toBeGreaterThan(0)
    expect(links.length).toBeLessThanOrEqual(3)
  })

  test('the page count covers both platforms', () => {
    bothAccounts()
    renderCards()
    expect(screen.getByTestId('status-header')).toHaveTextContent('3')
  })

  test('the grid control stays outside the RA section, since it drives both lists', () => {
    bothAccounts()
    renderCards()
    const raSection = screen.getByRole('region', { name: 'RetroAchievements' })
    fireEvent.click(screen.getByRole('button', { name: /RetroAchievements/ }))
    // Folding RA must not take the grid control away from the Steam list.
    expect(screen.getByTestId('status-header')).toBeInTheDocument()
    expect(raSection.contains(screen.getByTestId('status-header'))).toBe(false)
  })

  test('without Steam there is no fold — the RA page is as before', () => {
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: mockGames, loading: false, error: undefined })
    renderCards()
    expect(screen.queryByRole('region', { name: 'RetroAchievements' })).not.toBeInTheDocument()
    expect(screen.getByTestId('game-list')).toBeInTheDocument()
  })

  test('an empty RA list keeps the Steam section close by', () => {
    bothAccounts()
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: undefined })
    renderCards()
    fireEvent.click(screen.getByRole('button', { name: /RetroAchievements/ }))
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByTestId('steam-section')).toBeInTheDocument()
  })
})

describe('library filters and views', () => {
  const ra = { GameID: 1, Title: 'Sly Cooper', ConsoleID: 21, ConsoleName: 'PS2', PctWon: '0.9' }
  const steam = { id: 5, title: 'Hades', pctWon: 30, lastPlayed: '2020-01-01T00:00:00Z' }

  beforeEach(() => {
    localStorage.clear()
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [ra], loading: false, error: undefined })
    ;(useGameFiltering as jest.Mock).mockReturnValue([ra])
  })

  afterEach(() => {
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false })
    ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [] })
  })

  test('games in progress get quick filters with their counts', () => {
    renderCards()
    expect(screen.getByRole('button', { name: /Almost done 1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Stalled 0/ })).toBeDisabled()
  })

  test('the other categories have none', () => {
    ;(useParams as jest.Mock).mockReturnValue({ category: 'wantToPlay' })
    renderCards()
    expect(screen.queryByRole('group', { name: 'Quick filters' })).not.toBeInTheDocument()
  })

  test('there is no view toggle with one platform', () => {
    renderCards()
    expect(screen.queryByRole('group', { name: 'View' })).not.toBeInTheDocument()
  })

  test('with two platforms, "all together" mixes them into one list', () => {
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: true })
    ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [steam], loading: false })
    renderCards()
    fireEvent.click(screen.getByRole('button', { name: 'All together' }))
    expect(screen.getAllByTestId('mixed-item').map((n) => n.textContent)).toEqual(['Hades', 'Sly Cooper'])
    expect(screen.queryByTestId('steam-section')).not.toBeInTheDocument()
    // Last played first, games with no date after; and the choice is kept for the next visit.
    expect(localStorage.getItem('library-view')).toBe('all')
  })

  test('the stalled filter keeps only games left untouched', () => {
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: true })
    ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [steam], loading: false })
    renderCards()
    fireEvent.click(screen.getByRole('button', { name: 'All together' }))
    fireEvent.click(screen.getByRole('button', { name: /Stalled 1/ }))
    expect(screen.getAllByTestId('mixed-item').map((n) => n.textContent)).toEqual(['Hades'])
  })
})

describe('shelves and list', () => {
  const ra = { GameID: 1, Title: 'Sly Cooper', ConsoleID: 21, ConsoleName: 'PS2', PctWon: '0.5' }
  const steam = { id: 5, title: 'Hades', pctWon: 30, lastPlayed: null }

  beforeEach(() => {
    localStorage.clear()
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [ra], loading: false, error: undefined })
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: true })
    ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [steam], loading: false })
  })

  afterEach(() => {
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false })
    ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({ games: [] })
  })

  test('opens on the shelves, with the games of every platform together', () => {
    render(<CategoryPage />)
    const explorer = screen.getByTestId('explorer')
    expect(explorer).toHaveAttribute('data-layout', 'shelves')
    expect(explorer).toHaveTextContent('ra:1,steam:5')
    expect(screen.queryByTestId('steam-section')).not.toBeInTheDocument()
  })

  test('the layout left is the one it opens on next time, whatever the category', () => {
    const { unmount } = render(<CategoryPage />)
    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    expect(localStorage.getItem('library-layout')).toBe('list')
    unmount()
    ;(useParams as jest.Mock).mockReturnValue({ category: 'completed' })
    render(<CategoryPage />)
    expect(screen.getByTestId('explorer')).toHaveAttribute('data-layout', 'list')
  })

  test('a search that moves the shelves to the list does not overwrite the saved layout', () => {
    render(<CategoryPage />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'had' } })
    expect(screen.getByTestId('explorer')).toHaveAttribute('data-layout', 'list')
    expect(localStorage.getItem('library-layout')).toBeNull()
  })

  test('typing in the search while on the shelves goes to the list', () => {
    render(<CategoryPage />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'had' } })
    expect(screen.getByTestId('explorer')).toHaveAttribute('data-layout', 'list')
  })

  test('the toggle moves between the three views, and the cards are the platform sections', () => {
    render(<CategoryPage />)
    fireEvent.click(screen.getByRole('button', { name: 'List' }))
    expect(screen.getByTestId('explorer')).toHaveAttribute('data-layout', 'list')
    fireEvent.click(screen.getByRole('button', { name: 'Cards' }))
    expect(screen.queryByTestId('explorer')).not.toBeInTheDocument()
    expect(screen.getByTestId('steam-section')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Shelves' }))
    expect(screen.getByTestId('explorer')).toHaveAttribute('data-layout', 'shelves')
  })

  test('the explorer can ask for the list itself, as a picked card does', () => {
    render(<CategoryPage />)
    fireEvent.click(screen.getByText('to-list'))
    expect(screen.getByTestId('explorer')).toHaveAttribute('data-layout', 'list')
  })

  test('a platform selector beside the title narrows what the shelves and the list show', () => {
    render(<CategoryPage />)
    expect(screen.getByTestId('explorer')).toHaveTextContent('ra:1,steam:5')
    fireEvent.click(screen.getByRole('button', { name: 'Steam 1' }))
    expect(screen.getByTestId('explorer')).toHaveTextContent('steam:5')
    expect(screen.getByTestId('explorer')).not.toHaveTextContent('ra:1')
    expect(screen.getByRole('button', { name: 'Steam 1' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'All 2' }))
    expect(screen.getByTestId('explorer')).toHaveTextContent('ra:1,steam:5')
  })

  test('with no platform linked there is nothing to switch', () => {
    ;(useRaLinked as jest.Mock).mockReturnValue(false)
    ;(useSteamGamesData as jest.Mock).mockReturnValue({ isLinked: false })
    ;(useGamesByCategory as jest.Mock).mockReturnValue({ games: [], loading: false, error: undefined })
    render(<CategoryPage />)
    expect(screen.queryByRole('group', { name: 'Layout' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('explorer')).not.toBeInTheDocument()
  })
})
