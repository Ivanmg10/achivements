import { render, screen } from '@testing-library/react'
import CollectionShelf from './CollectionShelf'
import { en } from '@/translations/en'
import type { LatestPerfect } from '@/utils/perfectGames'

jest.mock('@/components/game-cover/GameCover', () => ({
  __esModule: true,
  default: ({ id }: { id: number }) => <span data-testid={`cover-${id}`} />,
}))

const game = (id: number, source: 'ra' | 'steam' = 'ra'): LatestPerfect => ({
  key: `${source}:${id}`, source, id, title: `Game ${id}`, subtitle: 'SNES', date: '2026-08-09T10:00:00Z', hardcore: true,
})
const counts = { hc: 7, sc: 2, steam: 15, psn: 0 }

test('the latest games, newest first, each with its place, cover and link', () => {
  render(<CollectionShelf games={[game(1), game(620, 'steam'), game(3)]} counts={counts} />)
  expect(screen.getByRole('heading', { name: en.cards.trophyCabinet })).toBeInTheDocument()
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(3)
  expect(items[0]).toHaveTextContent('1')
  expect(items[0]).toHaveTextContent('Game 1')
  expect(screen.getByTestId('cover-620')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Game 620/ })).toHaveAttribute('href', '/steamGame/620')
})

test('the counts of each kind sit by the title', () => {
  render(<CollectionShelf games={[game(1)]} counts={counts} />)
  expect(screen.getByText('7 HC')).toBeInTheDocument()
  expect(screen.getByText('15 Steam')).toBeInTheDocument()
})

test('nothing at 100% yet says so', () => {
  render(<CollectionShelf games={[]} counts={{ hc: 0, sc: 0, steam: 0, psn: 0 }} />)
  expect(screen.getByText(en.cards.noCompletedGames)).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})
