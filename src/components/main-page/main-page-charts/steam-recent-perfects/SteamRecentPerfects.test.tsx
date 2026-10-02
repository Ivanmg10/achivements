import { render, screen } from '@testing-library/react'
import SteamRecentPerfects from './SteamRecentPerfects'
import { en } from '@/translations/en'
import type { SteamGameProgress } from '@/types/steam'

const game = (id: number, done: number, lastPlayed: string | null) =>
  ({
    id, title: `Game ${id}`, imageIcon: '', maxPossible: 10, numAwarded: done, pctWon: done * 10,
    hasStats: true, achievementsLoaded: true, lastPlayed, playtimeForever: 60,
  }) as SteamGameProgress

test('only games at 100%, the latest session first', () => {
  render(<SteamRecentPerfects games={[game(1, 10, '2024-01-01T00:00:00Z'), game(2, 5, '2024-06-01T00:00:00Z'), game(3, 10, '2024-03-01T00:00:00Z')]} />)
  expect(screen.getByText(en.cards.recentPerfects)).toBeInTheDocument()
  expect(screen.getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual(['/steamGame/3', '/steamGame/1'])
})

test('no perfect games, nothing shown', () => {
  const { container } = render(<SteamRecentPerfects games={[game(1, 5, '2024-01-01T00:00:00Z')]} />)
  expect(container).toBeEmptyDOMElement()
})
