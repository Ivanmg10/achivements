jest.mock('@/hooks/useXboxGamesByCategory', () => ({ useXboxGamesByCategory: jest.fn() }))
jest.mock('@/components/xbox/xbox-status-game-item/XboxStatusGameItem', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="game">{game.title}</div>,
}))
jest.mock('@/components/collapsible-section/collapsible-section-preview/CollapsibleSectionPreview', () => ({
  __esModule: true,
  default: ({ games }: { games: { title: string }[] }) => <div data-testid="preview">{games.map((g) => g.title).join(',')}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import XboxCategorySection from './XboxCategorySection'
import { useXboxGamesByCategory } from '@/hooks/useXboxGamesByCategory'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const refetch = jest.fn()
const GAMES = [xboxGameFixture({ id: 1, title: 'Halo', pctWon: 40 }), xboxGameFixture({ id: 2, title: 'Forza', pctWon: 60 })]

function setGames(overrides: Record<string, unknown> = {}) {
  ;(useXboxGamesByCategory as jest.Mock).mockReturnValue({
    isLinked: true, games: GAMES, loading: false, error: null, refetch, ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  // The section remembers being open; every test starts folded.
  window.sessionStorage.clear()
  setGames()
})

const open = () => fireEvent.click(screen.getByRole('button', { name: /Xbox/ }))

test('folded, it previews its games, furthest along first', () => {
  render(<XboxCategorySection category="playing" />)
  expect(screen.getByTestId('preview')).toHaveTextContent('Forza,Halo')
})

test('open, it lists every game of its category', () => {
  render(<XboxCategorySection category="playing" />)
  open()
  expect(screen.getAllByTestId('game').map((g) => g.textContent)).toEqual(['Halo', 'Forza'])
})

test('filters by the page search', () => {
  render(<XboxCategorySection category="playing" query="nothing like it" />)
  open()
  expect(screen.queryByTestId('game')).not.toBeInTheDocument()
  expect(screen.getByText(en.search.noResults)).toBeInTheDocument()
})

test('an empty category says so', () => {
  setGames({ games: [] })
  render(<XboxCategorySection category="playing" />)
  open()
  expect(screen.getByText(en.xbox.noGamesInCategory)).toBeInTheDocument()
})

test('a failure says why and can be retried', () => {
  setGames({ games: [], error: 'private' })
  render(<XboxCategorySection category="playing" />)
  open()
  expect(screen.getByRole('alert')).toHaveTextContent(en.xbox.gamesError)
  expect(screen.getByText(en.xbox.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.xbox.retry }))
  expect(refetch).toHaveBeenCalled()
})

test('a skeleton while loading', () => {
  setGames({ games: [], loading: true })
  render(<XboxCategorySection category="playing" />)
  open()
  expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
})

test('renders nothing when Xbox is not linked', () => {
  setGames({ isLinked: false })
  const { container } = render(<XboxCategorySection category="playing" />)
  expect(container).toBeEmptyDOMElement()
})
