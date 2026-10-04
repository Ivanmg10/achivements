import { render, screen } from '@testing-library/react'
import CollectionNumbers from './CollectionNumbers'
import { en } from '@/translations/en'
import type { RetroAchievementsGameCompleted, UserAwards } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'

jest.mock('@/components/main-page/main-page-charts/closest-to-complete/ClosestToComplete', () => ({
  __esModule: true,
  CLOSEST_SHOWN: 3,
  default: ({ games }: { games: { title: string }[] }) => <ol data-testid="closest">{games.map((g) => <li key={g.title}>{g.title}</li>)}</ol>,
}))

const awards = {
  TotalAwardsCount: 27, MasteryAwardsCount: 7, CompletionAwardsCount: 2, BeatenHardcoreAwardsCount: 15,
  BeatenSoftcoreAwardsCount: 3, EventAwardsCount: 0, VisibleUserAwards: [],
} as UserAwards
const ra = (id: number, pct: string) =>
  ({ GameID: id, Title: `RA ${id}`, ImageIcon: '', ConsoleID: 1, ConsoleName: 'SNES', MaxPossible: 10, NumAwarded: 5, PctWon: pct, HardcoreMode: '1' }) as RetroAchievementsGameCompleted
const steam = (id: number, done: number) =>
  ({ id, title: `Steam ${id}`, imageIcon: '', maxPossible: 10, numAwarded: done, pctWon: done * 10, playtimeForever: 60, achievementsLoaded: true, hasStats: true }) as SteamGameProgress

test('both platforms at once, each with its headline', () => {
  render(<CollectionNumbers awards={awards} steamGames={[steam(1, 10), steam(2, 4)]} />)
  expect(screen.getByRole('heading', { name: en.cards.yourNumbers })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'RetroAchievements' })).toHaveTextContent('7')
  expect(screen.getByRole('region', { name: 'Steam' })).toHaveTextContent('1')
})

test('closest to perfect mixes the two platforms, nearest first', () => {
  render(<CollectionNumbers awards={awards} inProgress={[ra(1, '0.5'), ra(2, '0.95')]} steamGames={[steam(3, 9), steam(4, 2)]} />)
  const titles = Array.from(screen.getByTestId('closest').querySelectorAll('li')).map((li) => li.textContent)
  expect(titles).toEqual(['RA 2', 'Steam 3', 'RA 1'])
})

test('a platform with nothing to say is left out', () => {
  render(<CollectionNumbers awards={null} steamGames={[]} />)
  expect(screen.queryByRole('region', { name: 'RetroAchievements' })).not.toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'Steam' })).not.toBeInTheDocument()
})
