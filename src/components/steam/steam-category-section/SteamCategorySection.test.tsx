import { render, screen, fireEvent } from '@testing-library/react'
import SteamCategorySection from './SteamCategorySection'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import { en } from '@/translations/en'

jest.mock('@/hooks/useSteamGamesByCategory', () => ({ useSteamGamesByCategory: jest.fn() }))
jest.mock('../steam-game-item/SteamGameItem', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="steam-game">{game.title}</div>,
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

test('is a labelled section listing the games with a count', () => {
  render(<SteamCategorySection category="playing" />)

  expect(screen.getByRole('region', { name: en.steam.gamesSection })).toBeInTheDocument()
  expect(screen.getAllByTestId('steam-game').map((e) => e.textContent)).toEqual(['Portal 2', 'Hades'])
  expect(screen.getByText('2')).toBeInTheDocument()
})

test('shows a busy skeleton and no count while loading', () => {
  setHook({ loading: true, games: [] })
  const { container } = render(<SteamCategorySection category="playing" />)

  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
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
  test('warns that playing/completed may be incomplete when counts ran out', () => {
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

test.each([
  [1, 'grid-cols-1'],
  [2, 'md:grid-cols-2'],
  [3, 'lg:grid-cols-3'],
] as const)('lays out %i column(s) and stays single-column on phones', (cols, cls) => {
  const { container } = render(<SteamCategorySection category="playing" gridCols={cols} />)
  const grid = container.querySelector('.grid') as HTMLElement
  expect(grid.className).toContain(cls)
  expect(grid.className).toContain('grid-cols-1')
})

test('defaults to two columns', () => {
  const { container } = render(<SteamCategorySection category="playing" />)
  expect((container.querySelector('.grid') as HTMLElement).className).toContain('md:grid-cols-2')
})
