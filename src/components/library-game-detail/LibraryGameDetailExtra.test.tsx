jest.mock('@/components/game-achievements-progress-chart/GameAchievementsProgressChart', () => ({
  GameAchievementsProgressChart: () => <div data-testid="chart" />,
}))
jest.mock('./library-detail-calendar/LibraryDetailCalendar', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="calendar">{game.title}</div>,
}))

import { render, screen, within } from '@testing-library/react'
import LibraryGameDetail from './LibraryGameDetail'
import { en } from '@/translations/en'
import type { InsightAchievement } from '@/utils/gameInsights'

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const a = (id: string, o: Partial<InsightAchievement> = {}): InsightAchievement => ({
  id, title: `Title ${id}`, description: `Desc ${id}`, earned: false, earnedAt: null, rarity: 50, points: null, kind: null, iconUrl: null, href: `/g#${id}`, ...o,
})

const L = en.libraryDetail
const base = { state: 'ready' as const, ring: { earned: 1, total: 3, label: 'All achievements' }, grid: <div data-testid="grid" />, empty: 'No achievements' }
const game = { source: 'steam' as const, id: 7, title: 'Hades' }

const inProgress = [
  a('done1', { earned: true, earnedAt: daysAgo(20), rarity: 5 }),
  a('done2', { earned: true, earnedAt: daysAgo(10), rarity: 60 }),
  a('done3', { earned: true, earnedAt: daysAgo(2), rarity: 30 }),
  a('easy', { rarity: 90 }),
  a('hard', { rarity: 1 }),
]
const finished = inProgress.slice(0, 3)
const notStarted = inProgress.map((x) => ({ ...x, earned: false, earnedAt: null }))

test('playing: the calendar of the game, and the latest unlocked with their dates', () => {
  render(<LibraryGameDetail {...base} category="playing" items={inProgress} game={game} />)
  expect(screen.getByTestId('calendar')).toHaveTextContent('Hades')
  const latest = within(screen.getByText(L.recentTitle).parentElement!).getAllByRole('link')
  expect(latest.map((l) => l.getAttribute('href'))).toEqual(['/g#done3', '/g#done2', '/g#done1'])
  expect(latest[0]).toHaveTextContent(new Date(finished[2].earnedAt!).toLocaleDateString('en'))
})

test('completed: the calendar, and the milestones with the days they were reached', () => {
  render(<LibraryGameDetail {...base} category="completed" items={finished} game={game} />)
  expect(screen.getByTestId('calendar')).toBeInTheDocument()
  expect(screen.getByText(L.milestonesTitle)).toBeInTheDocument()
  expect(screen.getByText(L.milestoneFirst)).toBeInTheDocument()
  expect(screen.getByText(L.milestonePct.replace('{n}', '100'))).toBeInTheDocument()
  expect(screen.queryByText(L.recentTitle)).not.toBeInTheDocument()
})

test('wantToPlay: the hardest ones, and what is known of the game beside them', () => {
  render(<LibraryGameDetail {...base} category="wantToPlay" items={notStarted} game={game} info={[{ label: L.developer, value: 'Supergiant' }]} />)
  const hard = within(screen.getByText(L.hardestTitle).parentElement!).getAllByRole('link')
  expect(hard[0].getAttribute('href')).toBe('/g#hard')
  expect(screen.getByText('Supergiant')).toBeInTheDocument()
  expect(screen.queryByTestId('calendar')).not.toBeInTheDocument()
})

test('wantToPlay with nothing known of the game: the hardest take the whole row', () => {
  render(<LibraryGameDetail {...base} category="wantToPlay" items={notStarted} game={game} />)
  expect(screen.queryByText(L.infoTitle)).not.toBeInTheDocument()
  expect(screen.getByText(L.hardestTitle).parentElement!.parentElement).toHaveClass('@3xl:col-span-3')
})

test('no calendar when the game is not said, but the list of latest stays', () => {
  render(<LibraryGameDetail {...base} category="playing" items={inProgress} />)
  expect(screen.queryByTestId('calendar')).not.toBeInTheDocument()
  expect(screen.getByText(L.recentTitle)).toBeInTheDocument()
})

test('nothing extra while loading or on error', () => {
  const { rerender } = render(<LibraryGameDetail {...base} state="loading" category="playing" items={[]} game={game} />)
  expect(screen.queryByText(L.recentTitle)).not.toBeInTheDocument()
  rerender(<LibraryGameDetail {...base} state="error" category="completed" items={[]} game={game} />)
  expect(screen.queryByText(L.milestonesTitle)).not.toBeInTheDocument()
})
