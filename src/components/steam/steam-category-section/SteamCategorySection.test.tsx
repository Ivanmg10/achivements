import { render, screen, fireEvent } from '@testing-library/react'
import SteamCategorySection from './SteamCategorySection'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import { en } from '@/translations/en'

jest.mock('@/hooks/useSteamGamesByCategory', () => ({ useSteamGamesByCategory: jest.fn() }))
jest.mock('@/components/steam/steam-status-game-list/SteamStatusGameList', () => ({
  __esModule: true,
  default: ({ games, gridCols }: { games: { title: string }[]; gridCols: number }) => (
    <div data-testid="list" data-cols={gridCols}>
      {games.map((g) => g.title).join(',')}
    </div>
  ),
}))

const refetch = jest.fn()
const GAMES = [{ id: 1, title: 'Portal 2' }, { id: 2, title: 'Hades' }]

function setHook(overrides: Record<string, unknown> = {}) {
  ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({
    games: GAMES,
    isLinked: true,
    loading: false,
    error: null,
    progressTruncated: false,
    refetch,
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  window.sessionStorage.clear()
  // Most tests look at the unfolded list; folding has its own tests below.
  for (const c of ['playing', 'completed', 'wantToPlay']) window.sessionStorage.setItem(`steam-section-open:${c}`, 'open')
  setHook()
})

test('renders nothing for a user without Steam', () => {
  setHook({ isLinked: false })
  const { container } = render(<SteamCategorySection category="playing" />)
  expect(container).toBeEmptyDOMElement()
})

test('asks for the given category', () => {
  render(<SteamCategorySection category="completed" />)
  expect(useSteamGamesByCategory).toHaveBeenCalledWith('completed')
})

test('is a labelled section listing the games, with a count', () => {
  render(<SteamCategorySection category="playing" />)

  expect(screen.getByRole('region', { name: en.steam.gamesSection })).toBeInTheDocument()
  expect(screen.getByTestId('list')).toHaveTextContent('Portal 2,Hades')
  expect(screen.getByText('2')).toBeInTheDocument()
})

test('hands the grid choice to the RA-style masonry list', () => {
  render(<SteamCategorySection category="playing" gridCols={3} />)
  expect(screen.getByTestId('list').dataset.cols).toBe('3')
})

test('defaults to two columns', () => {
  render(<SteamCategorySection category="playing" />)
  expect(screen.getByTestId('list').dataset.cols).toBe('2')
})

describe('folding', () => {
  test('folds away so the page below does not have to be scrolled past', () => {
    render(<SteamCategorySection category="playing" />)
    fireEvent.click(screen.getByRole('button', { expanded: true }))
    expect(screen.queryByTestId('list')).not.toBeInTheDocument()
  })

  test('remembers the state per category for the session', () => {
    render(<SteamCategorySection category="playing" />)
    fireEvent.click(screen.getByRole('button', { expanded: true }))
    expect(window.sessionStorage.getItem('steam-section-open:playing')).toBe('closed')
  })

  test('starts folded on a new visit, previewing the first games', () => {
    window.sessionStorage.clear()
    render(<SteamCategorySection category="playing" />)
    expect(screen.queryByTestId('list')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Portal 2/ }).getAttribute('href')).toBe('/steamGame/1')
    fireEvent.click(screen.getByRole('button', { name: en.categoryPage.showAllGames.replace('{n}', '2') }))
    expect(screen.getByTestId('list')).toBeInTheDocument()
  })

  test('folded, it previews placeholders while loading', () => {
    window.sessionStorage.clear()
    setHook({ loading: true, games: [] })
    const { container } = render(<SteamCategorySection category="playing" />)
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3)
    expect(screen.getByRole('button', { name: en.categoryPage.showAll })).toBeInTheDocument()
  })
})

test('shows a busy skeleton and no count while loading', () => {
  setHook({ loading: true, games: [] })
  const { container } = render(<SteamCategorySection category="playing" gridCols={3} />)

  const skeleton = container.querySelector('[aria-busy="true"]') as HTMLElement
  expect(skeleton).not.toBeNull()
  // Single column on phones, as the real list is.
  expect(skeleton.className).toContain('grid-cols-1')
  expect(skeleton.className).toContain('lg:grid-cols-3')
  expect(screen.queryByText('0')).not.toBeInTheDocument()
})

test('announces an error with the privacy hint and a retry', () => {
  setHook({ error: 'boom', games: [] })
  render(<SteamCategorySection category="playing" />)

  expect(screen.getByRole('alert')).toHaveTextContent(en.steam.gamesError)
  expect(screen.getByText(en.steam.privateProfileHint)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.steam.retry }))
  expect(refetch).toHaveBeenCalledTimes(1)
})

test('shows an empty state when the category has no Steam games', () => {
  setHook({ games: [] })
  render(<SteamCategorySection category="playing" />)
  expect(screen.getByText(en.steam.noGamesInCategory)).toBeInTheDocument()
})

describe('partial progress note', () => {
  test('warns that playing/completed may be incomplete while counts are missing', () => {
    setHook({ progressTruncated: true })
    render(<SteamCategorySection category="completed" />)
    expect(screen.getByText(en.steam.partialProgressNote)).toBeInTheDocument()
  })

  test('is not shown for want to play, which does not depend on counts', () => {
    setHook({ progressTruncated: true })
    render(<SteamCategorySection category="wantToPlay" />)
    expect(screen.queryByText(en.steam.partialProgressNote)).not.toBeInTheDocument()
  })

  test('is not shown when every game was counted', () => {
    render(<SteamCategorySection category="playing" />)
    expect(screen.queryByText(en.steam.partialProgressNote)).not.toBeInTheDocument()
  })
})

test('takes a heading override for pages showing several categories', () => {
  render(<SteamCategorySection category="playing" title="Steam · Playing" />)
  expect(screen.getByRole('region', { name: 'Steam · Playing' })).toBeInTheDocument()
})

test('applies root classes, and renders no wrapper at all when unlinked', () => {
  const { container, rerender } = render(<SteamCategorySection category="playing" className="bg-bg-card" />)
  expect((container.firstChild as HTMLElement).className).toContain('bg-bg-card')

  setHook({ isLinked: false })
  rerender(<SteamCategorySection category="playing" className="bg-bg-card" />)
  expect(container).toBeEmptyDOMElement()
})

describe('shared search', () => {
  test('keeps only the games matching the page-wide filter, counting them in the heading', () => {
    render(<SteamCategorySection category="playing" query="port" />)
    expect(screen.getByTestId('list')).toHaveTextContent('Portal 2')
    expect(screen.getByTestId('list')).not.toHaveTextContent('Hades')
    expect(screen.getByRole('button', { name: /Steam/ })).toHaveTextContent('1')
  })

  test('matches ignoring case and accents', () => {
    ;(useSteamGamesByCategory as jest.Mock).mockReturnValue({
      games: [{ id: 3, title: 'Pokémon Colosseum' }], isLinked: true, loading: false, error: null, progressTruncated: false, refetch,
    })
    render(<SteamCategorySection category="playing" query="pokemon" />)
    expect(screen.getByTestId('list')).toHaveTextContent('Pokémon Colosseum')
  })

  test('says no game matches, rather than that the category is empty', () => {
    render(<SteamCategorySection category="playing" query="zelda" />)
    expect(screen.getByText(en.search.noResults)).toBeInTheDocument()
    expect(screen.queryByText(en.steam.noGamesInCategory)).not.toBeInTheDocument()
  })
})
