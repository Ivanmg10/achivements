jest.mock('@/hooks/usePsnGamesByCategory', () => ({ usePsnGamesByCategory: jest.fn() }))
jest.mock('@/components/psn/psn-status-game-item/PsnStatusGameItem', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="game">{game.title}</div>,
}))
jest.mock('@/components/collapsible-section/collapsible-section-preview/CollapsibleSectionPreview', () => ({
  __esModule: true,
  default: ({ games }: { games: { title: string }[] }) => <div data-testid="preview">{games.map((g) => g.title).join(',')}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnCategorySection from './PsnCategorySection'
import { usePsnGamesByCategory } from '@/hooks/usePsnGamesByCategory'
import { en } from '@/translations/en'

const refetch = jest.fn()
const GAMES = [
  { id: 1, title: 'Bloodborne', pctWon: 40, imageIcon: 'b.png' },
  { id: 2, title: 'Astro Bot', pctWon: 60, imageIcon: 'a.png' },
]

function setGames(overrides: Record<string, unknown> = {}) {
  ;(usePsnGamesByCategory as jest.Mock).mockReturnValue({
    isLinked: true, games: GAMES, loading: false, error: null, refetch, ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  // The section remembers being open; every test starts folded.
  window.sessionStorage.clear()
  setGames()
})

const open = () => fireEvent.click(screen.getByRole('button', { name: /PlayStation/ }))

test('folded, it previews its games, furthest along first', () => {
  render(<PsnCategorySection category="playing" />)
  expect(screen.getByTestId('preview')).toHaveTextContent('Astro Bot,Bloodborne')
})

test('open, it lists every game of its category', () => {
  render(<PsnCategorySection category="playing" />)
  open()
  expect(screen.getAllByTestId('game').map((g) => g.textContent)).toEqual(['Bloodborne', 'Astro Bot'])
})

test('filters by the page search', () => {
  render(<PsnCategorySection category="playing" query="nothing like it" />)
  open()
  expect(screen.queryByTestId('game')).not.toBeInTheDocument()
  expect(screen.getByText(en.search.noResults)).toBeInTheDocument()
})

test('renders nothing when PSN is not linked', () => {
  setGames({ isLinked: false })
  const { container } = render(<PsnCategorySection category="playing" />)
  expect(container).toBeEmptyDOMElement()
})

test('"no achievements" has a PSN section too', () => {
  render(<PsnCategorySection category="wantToPlay" />)
  expect(screen.getByRole('button', { name: /PlayStation/ })).toBeInTheDocument()
})

test('a failed load says why and can be retried', () => {
  setGames({ games: [], error: 'private' })
  render(<PsnCategorySection category="playing" />)
  open()
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.gamesError)
  expect(screen.getByText(en.psn.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.psn.retry }))
  expect(refetch).toHaveBeenCalled()
})
