import { render, screen } from '@testing-library/react'
import CollectionShelf from './CollectionShelf'
import { en } from '@/translations/en'
import type { LatestPerfect } from '@/utils/perfectGames'

jest.mock('@/components/game-cover/GameCover', () => ({
  __esModule: true,
  default: ({ id }: { id: number }) => <span data-testid={`cover-${id}`} />,
}))

const game = (id: number, source: 'ra' | 'steam' | 'psn' = 'ra', over: Partial<LatestPerfect> = {}): LatestPerfect => ({
  key: `${source}:${id}`, source, id, title: `Game ${id}`, subtitle: 'SNES', date: '2025-08-09T10:00:00Z', hardcore: source === 'ra', ...over,
})
const counts = { hc: 7, sc: 2, steam: 15, psn: 0, xbox: 0 }

test('the latest games, newest first, each with its cover, date and link; no place on them (a date order, not a rank)', () => {
  render(<CollectionShelf games={[game(1), game(620, 'steam'), game(3)]} counts={counts} />)
  expect(screen.getByRole('heading', { name: en.cards.trophyCabinet })).toBeInTheDocument()
  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(3)
  expect(items[0]).toHaveTextContent('Game 1')
  expect(items[0]).toHaveTextContent('Aug 9, 2025')
  expect(items[0].querySelector('.rounded-full')).toBeNull()
  expect(screen.getByTestId('cover-620')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Game 620/ })).toHaveAttribute('href', '/steamGame/620')
})

test('how each was finished, in a word: hardcore, platinum or 100%', () => {
  render(<CollectionShelf games={[game(1), game(2, 'psn', { platinum: true }), game(3, 'psn'), game(4, 'steam')]} counts={counts} />)
  const items = screen.getAllByRole('listitem')
  expect(items[0]).toHaveTextContent(en.achievement.hardcore)
  expect(items[1]).toHaveTextContent(en.psn.platinum)
  expect(items[2]).toHaveTextContent(en.cards.perfectWord)
  expect(items[3]).toHaveTextContent(en.cards.perfectWord)
  expect(screen.queryByText('HC')).not.toBeInTheDocument()
})

test('the counts of each kind sit by the title, in words', () => {
  render(<CollectionShelf games={[game(1)]} counts={counts} />)
  expect(screen.getByText(`7 ${en.achievement.hardcore}`)).toBeInTheDocument()
  expect(screen.getByText(`2 ${en.achievement.softcore}`)).toBeInTheDocument()
  expect(screen.getByText('15 Steam')).toBeInTheDocument()
})

test('nothing at 100% yet says so', () => {
  render(<CollectionShelf games={[]} counts={{ hc: 0, sc: 0, steam: 0, psn: 0, xbox: 0 }} />)
  expect(screen.getByText(en.cards.noCompletedGames)).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})
