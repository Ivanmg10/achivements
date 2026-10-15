import { render, screen } from '@testing-library/react'
import LibraryAllList from './LibraryAllList'
import type { LibraryEntry } from '@/utils/libraryInsights'

jest.mock('@/components/statusGameList/StatusGameItem', () => ({
  __esModule: true,
  default: ({ game }: { game: { Title: string } }) => <div data-testid="ra">{game.Title}</div>,
}))
jest.mock('@/components/steam/steam-status-game-item/SteamStatusGameItem', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="steam">{game.title}</div>,
}))
jest.mock('@/components/psn/psn-status-game-item/PsnStatusGameItem', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="psn">{game.title}</div>,
}))

const entries = [
  { kind: 'psn', key: 'psn:1', title: 'P', pct: 1, lastPlayed: null, game: { title: 'P' } },
  { kind: 'ra', key: 'ra:2', title: 'R', pct: 1, lastPlayed: null, game: { Title: 'R' } },
  { kind: 'steam', key: 'steam:3', title: 'S', pct: 1, lastPlayed: null, game: { title: 'S' } },
] as unknown as LibraryEntry[]

test('draws each game with its own platform\'s card, in the given order', () => {
  render(<LibraryAllList entries={entries} category="playing" />)
  expect(screen.getAllByTestId(/^(ra|steam|psn)$/).map((n) => n.dataset.testid)).toEqual(['psn', 'ra', 'steam'])
})

test('says so when nothing matches', () => {
  render(<LibraryAllList entries={[]} category="playing" />)
  expect(screen.getByText('No games match this filter')).toBeInTheDocument()
})
