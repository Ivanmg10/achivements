jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))
jest.mock('@/hooks/usePsnTrophies', () => ({ usePsnTrophies: jest.fn() }))
jest.mock('@/components/game-info-skeleton/GameInfoSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="loading" />,
}))
jest.mock('@/components/psn/psn-game-info-header/PsnGameInfoHeader', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="header">{game.title}</div>,
}))
jest.mock('@/components/psn/psn-game-info-table/PsnGameInfoTable', () => ({
  __esModule: true,
  default: ({ trophies }: { trophies: unknown[] }) => <div data-testid="table">{trophies.length}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnGamePage from './page'
import { useParams, notFound } from 'next/navigation'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { en } from '@/translations/en'

const ID = 'NPWR00001_00'
const GAME = { id: 100, titleId: ID, title: 'Astro Bot', imageIcon: 'a.png' }
const retry = jest.fn()

function setup({
  id = ID,
  linked = true,
  library = [GAME] as unknown[],
  libraryLoading = false,
  trophies = { trophies: [{ id: 0 }, { id: 1 }], isLoading: false, error: null as string | null },
} = {}) {
  ;(useParams as jest.Mock).mockReturnValue({ id })
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ isLinked: linked, library, libraryLoading })
  ;(usePsnTrophies as jest.Mock).mockReturnValue({ ...trophies, retry })
}

beforeEach(() => jest.clearAllMocks())

test('a game in the list: header, then its trophy table', () => {
  setup()
  render(<PsnGamePage />)
  expect(screen.getByTestId('header')).toHaveTextContent('Astro Bot')
  expect(screen.getByTestId('table')).toHaveTextContent('2')
  expect(usePsnTrophies).toHaveBeenCalledWith(ID)
})

test.each([
  ['a malformed id', { id: 'nope' }],
  ["a game not in the account's list", { library: [] }],
])('404 for %s', (_name, overrides) => {
  setup(overrides)
  expect(() => render(<PsnGamePage />)).toThrow('NEXT_NOT_FOUND')
  expect(notFound).toHaveBeenCalled()
})

test('without PSN linked, points to the account page and loads nothing', () => {
  setup({ linked: false })
  render(<PsnGamePage />)
  expect(screen.getByRole('link', { name: en.psn.connect })).toHaveAttribute('href', '/user')
  expect(usePsnTrophies).toHaveBeenCalledWith(null)
})

test('a skeleton while the list loads', () => {
  setup({ library: [], libraryLoading: true })
  render(<PsnGamePage />)
  expect(screen.getByTestId('loading')).toBeInTheDocument()
})

test('a failed load says so and can be retried', () => {
  setup({ trophies: { trophies: [], isLoading: false, error: 'private' } })
  render(<PsnGamePage />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.trophiesError)
  expect(screen.getByText(en.psn.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.psn.retry }))
  expect(retry).toHaveBeenCalled()
})

test('a game without trophies says so', () => {
  setup({ trophies: { trophies: [], isLoading: false, error: null } })
  render(<PsnGamePage />)
  expect(screen.getByText(en.psn.noTrophies)).toBeInTheDocument()
})
