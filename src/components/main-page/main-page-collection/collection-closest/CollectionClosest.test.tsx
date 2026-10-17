import { render, screen } from '@testing-library/react'
import CollectionClosest from './CollectionClosest'
import type { RetroAchievementsGameCompleted } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import { psnGameFixture } from '@/test-utils/psnFixtures'

jest.mock('@/components/main-page/main-page-charts/closest-to-complete/ClosestToComplete', () => ({
  __esModule: true,
  CLOSEST_SHOWN: 3,
  default: ({ games }: { games: { title: string }[] }) => <ol data-testid="closest">{games.map((g) => <li key={g.title}>{g.title}</li>)}</ol>,
}))

const ra = (id: number, pct: string) =>
  ({ GameID: id, Title: `RA ${id}`, ImageIcon: '', ConsoleID: 1, ConsoleName: 'SNES', MaxPossible: 10, NumAwarded: 5, PctWon: pct, HardcoreMode: '1' }) as RetroAchievementsGameCompleted
const steam = (id: number, done: number) =>
  ({ id, title: `Steam ${id}`, imageIcon: '', maxPossible: 10, numAwarded: done, pctWon: done * 10, playtimeForever: 60, achievementsLoaded: true, hasStats: true }) as SteamGameProgress
const titles = () => Array.from(screen.getByTestId('closest').querySelectorAll('li')).map((li) => li.textContent)

test('the started games nearest 100%, mixing the platforms, nearest first', () => {
  render(<CollectionClosest inProgress={[ra(1, '0.5'), ra(2, '0.95')]} steamGames={[steam(3, 9), steam(4, 2)]} />)
  expect(titles()).toEqual(['RA 2', 'Steam 3', 'RA 1'])
})

test('PSN games under way join them; a finished one does not', () => {
  const psn = (id: number, pctWon: number) => psnGameFixture({ id, title: `PS ${id}`, pctWon, numAwarded: 1, maxPossible: 10, earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 }, defined: { bronze: 9, silver: 0, gold: 0, platinum: 1 } })
  render(<CollectionClosest psnGames={[psn(1, 100), psn(2, 95)]} />)
  expect(titles()).toEqual(['PS 2'])
})

test('nothing near 100%: no card at all, so the collection takes the row', () => {
  const { container } = render(<CollectionClosest />)
  expect(container).toBeEmptyDOMElement()
})
