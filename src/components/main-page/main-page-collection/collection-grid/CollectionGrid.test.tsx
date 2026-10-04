import { fireEvent, render, screen, within } from '@testing-library/react'
import CollectionGrid from './CollectionGrid'
import { en } from '@/translations/en'
import type { PerfectGame } from '@/utils/perfectGames'

jest.mock('@/components/main-page/perfect-games-order-modal/PerfectGamesOrderModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="order-modal" /> : null),
}))
jest.mock('../collection-tile/CollectionTile', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <span>{game.title}</span>,
}))

const g = (key: string, title: string, hardcore = true): PerfectGame => {
  const [source, id] = key.split(':')
  return { key, source: source as 'ra' | 'steam', id: Number(id), title, subtitle: '', hardcore }
}
const GAMES = [g('ra:1', 'Zelda'), g('ra:2', 'Metroid', false), g('steam:620', 'Portal 2', false)]
const DATES = new Map([
  ['ra:1', '2025-03-01T00:00:00Z'],
  ['steam:620', '2026-01-01T00:00:00Z'],
])

const renderGrid = () =>
  render(<CollectionGrid games={GAMES} allGames={GAMES} dates={DATES} order={[]} onSaveOrder={jest.fn().mockResolvedValue(undefined)} />)

test('"by year" groups them, newest first, undated last', () => {
  renderGrid()
  fireEvent.click(screen.getByRole('button', { name: en.cards.viewByYear }))
  const headings = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)
  expect(headings).toEqual(['2026· 1', '2025· 1', `${en.cards.undated}· 1`])
})

test('the chips narrow it to one kind, with how many each has', () => {
  renderGrid()
  fireEvent.click(screen.getByRole('button', { name: `${en.cards.filterRaSc} 1` }))
  expect(screen.getByText('Metroid')).toBeInTheDocument()
  expect(screen.queryByText('Zelda')).not.toBeInTheDocument()
})

test('by default, in the user’s order, with the order editable', () => {
  renderGrid()
  expect(screen.getByRole('button', { name: en.cards.viewMyOrder })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.queryAllByRole('heading', { level: 4 })).toHaveLength(0)
  const list = screen.getByRole('list')
  expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Zelda', 'Metroid', 'Portal 2'])
  fireEvent.click(screen.getByRole('button', { name: en.cards.reorderMasteredAria }))
  expect(screen.getByTestId('order-modal')).toBeInTheDocument()
})

test('"by year" hides the edit-order button, which only applies to "my order"', () => {
  renderGrid()
  fireEvent.click(screen.getByRole('button', { name: en.cards.viewByYear }))
  expect(screen.queryByRole('button', { name: en.cards.reorderMasteredAria })).not.toBeInTheDocument()
})
