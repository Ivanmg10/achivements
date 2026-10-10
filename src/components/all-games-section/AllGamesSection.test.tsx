jest.mock('@/components/statusGameList/StatusGameList', () => ({
  __esModule: true,
  default: ({ games, category }: { games: { GameID: number; Title: string }[]; category: string }) => (
    <ul data-testid="list" data-category={category}>
      {games.map((g) => <li key={g.GameID}>{g.Title}</li>)}
    </ul>
  ),
}))
jest.mock('@/components/main-spinner/Spinner', () => ({ __esModule: true, default: () => <div data-testid="spinner" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import AllGamesSection from './AllGamesSection'
import { en } from '@/translations/en'
import { CONSOLES } from '@/constants'

const A = CONSOLES[0]
const B = CONSOLES[1]

const game = (id: number, console_: { id: number; name: string }, over: Record<string, unknown> = {}) => ({
  GameID: id, Title: `Game ${id}`, ConsoleID: console_.id, ConsoleName: console_.name, HardcoreMode: '0', ...over,
})

function setup(props: Partial<React.ComponentProps<typeof AllGamesSection>> = {}) {
  return render(
    <AllGamesSection category="playing" games={[game(1, A), game(2, B)] as never} loading={false} extraData={new Map()} {...props} />,
  )
}
const titles = () => screen.getAllByRole('listitem').map((li) => li.textContent)
const header = () => screen.getByRole('button', { name: new RegExp(en.categories.playing) })

test('a spinner while loading, and an ellipsis instead of a count', () => {
  setup({ loading: true })
  expect(screen.getByTestId('spinner')).toBeInTheDocument()
  expect(header()).toHaveTextContent('…')
  expect(screen.queryByTestId('list')).not.toBeInTheDocument()
})

test('says there are no games when there are none', () => {
  setup({ games: [] })
  expect(screen.getByText(en.cards.noGames)).toBeInTheDocument()
})

test('shows the games of the category with their count in the header', () => {
  setup()
  expect(titles()).toEqual(['Game 1', 'Game 2'])
  expect(screen.getByTestId('list')).toHaveAttribute('data-category', 'playing')
  expect(header()).toHaveTextContent('2')
})

test('the header folds the section and says whether it is open', () => {
  setup()
  expect(header()).toHaveAttribute('aria-expanded', 'true')
  fireEvent.click(header())
  expect(header()).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(header())
  expect(header()).toHaveAttribute('aria-expanded', 'true')
})

test('filtering by a console narrows the list and the count, and clearing brings the rest back', () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: B.name }))
  expect(titles()).toEqual(['Game 2'])
  expect(header()).toHaveTextContent('1')
  fireEvent.click(screen.getByRole('button', { name: en.categoryPage.clearConsoles }))
  expect(titles()).toEqual(['Game 1', 'Game 2'])
})

test('a filter that leaves nothing says so', () => {
  setup({ games: [game(1, A)] as never })
  fireEvent.click(screen.getByRole('button', { name: B.name }))
  expect(screen.getByText(en.groups.noGamesFilter)).toBeInTheDocument()
})

describe('completed', () => {
  const games = [game(1, A, { HardcoreMode: '1' }), game(2, A, { HardcoreMode: '0' }), game(3, B, { HardcoreMode: '1' })] as never

  test('can be narrowed to hardcore or softcore', () => {
    setup({ category: 'completed', games })
    expect(titles()).toEqual(['Game 1', 'Game 2', 'Game 3'])
    fireEvent.click(screen.getByRole('button', { name: en.categoryPage.hardcore }))
    expect(titles()).toEqual(['Game 1', 'Game 3'])
    fireEvent.click(screen.getByRole('button', { name: en.categoryPage.softcore }))
    expect(titles()).toEqual(['Game 2'])
    fireEvent.click(screen.getByRole('button', { name: en.gameInfoTable.filterAll }))
    expect(titles()).toHaveLength(3)
  })

  test('other categories have no such filter', () => {
    setup({ category: 'playing', games })
    expect(screen.queryByRole('button', { name: en.categoryPage.hardcore })).not.toBeInTheDocument()
  })
})
