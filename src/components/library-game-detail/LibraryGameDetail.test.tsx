jest.mock('@/components/game-achievements-progress-chart/GameAchievementsProgressChart', () => ({
  GameAchievementsProgressChart: ({ isLoading }: { isLoading?: boolean }) => <div data-testid="chart">{String(!!isLoading)}</div>,
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

const inProgress = [
  a('done1', { earned: true, earnedAt: daysAgo(20), rarity: 5, points: 10 }),
  a('done2', { earned: true, earnedAt: daysAgo(10), rarity: 60, points: 5 }),
  a('done3', { earned: true, earnedAt: daysAgo(2), rarity: 30, points: 5 }),
  a('easy', { rarity: 90, points: 5 }),
  a('hard', { rarity: 1, points: 50, kind: 'missable' }),
]

test('playing: the unlocks chart, the next targets easiest first, and what is left', () => {
  render(<LibraryGameDetail {...base} category="playing" items={inProgress} />)
  expect(screen.getByTestId('chart')).toBeInTheDocument()
  expect(screen.queryByText(L.difficulty)).not.toBeInTheDocument()
  const targets = within(screen.getByText(L.nextTargets).parentElement!).getAllByRole('link')
  expect(targets.map((l) => l.getAttribute('href'))).toEqual(['/g#easy', '/g#hard'])
  expect(screen.getByText(en.gameExpanded.remaining).nextSibling).toHaveTextContent('2')
  expect(screen.getByText(en.gameExpanded.points).nextSibling).toHaveTextContent('20 / 75')
  expect(screen.getByText(L.missable).nextSibling).toHaveTextContent('1')
  expect(screen.getByText(L.pace)).toBeInTheDocument()
  expect(screen.getByTestId('grid')).toBeInTheDocument()
})

test('completed: the rarest earned, when it was finished and how long it took', () => {
  const done = inProgress.slice(0, 3)
  render(<LibraryGameDetail {...base} category="completed" items={done} ring={{ ...base.ring, earned: 3 }} />)
  expect(screen.getByTestId('chart')).toBeInTheDocument()
  const rarest = within(screen.getByText(L.rarestEarned).parentElement!).getAllByRole('link')
  expect(rarest.map((l) => l.getAttribute('href'))).toEqual(['/g#done1', '/g#done3', '/g#done2'])
  expect(screen.getByText(L.finished)).toBeInTheDocument()
  expect(screen.getByText(L.timeSpan).nextSibling).toHaveTextContent('18 d')
  // Nothing is left to do, so no remaining count or pace.
  expect(screen.queryByText(en.gameExpanded.remaining)).not.toBeInTheDocument()
  expect(screen.queryByText(L.pace)).not.toBeInTheDocument()
})

test('wantToPlay: how hard it is and the easiest way in, no chart, points in total', () => {
  const fresh = [a('x', { rarity: 80, points: 5 }), a('y', { rarity: 2, points: 25 })]
  render(<LibraryGameDetail {...base} category="wantToPlay" items={fresh} ring={{ ...base.ring, earned: 0, total: 2 }} />)
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
  expect(screen.getByText(L.difficulty)).toBeInTheDocument()
  expect(screen.getByText(L.startWith)).toBeInTheDocument()
  expect(screen.getByText(en.gameExpanded.points).nextSibling).toHaveTextContent(/^30$/)
})

test('the platform\'s own figures come first', () => {
  render(<LibraryGameDetail {...base} category="playing" items={inProgress} facts={[{ label: 'Playtime', value: '12 h' }]} />)
  const labels = screen.getAllByRole('term').map((t) => t.textContent)
  expect(labels[0]).toBe('Playtime')
  expect(labels.length).toBeGreaterThan(1)
})

test('while loading it shows placeholders, and neither the grid nor computed figures', () => {
  const { container } = render(<LibraryGameDetail {...base} category="playing" items={[]} state="loading" facts={[{ label: 'Playtime', value: '12 h' }]} />)
  expect(container.querySelectorAll('[aria-busy="true"]').length).toBeGreaterThan(0)
  expect(screen.getByTestId('chart')).toHaveTextContent('true')
  expect(screen.queryByTestId('grid')).not.toBeInTheDocument()
  expect(screen.getByText('Playtime')).toBeInTheDocument()
  expect(screen.queryByText(en.gameExpanded.remaining)).not.toBeInTheDocument()
})

test('on error it shows what the platform gives, keeps the ring and drops the rest', () => {
  render(<LibraryGameDetail {...base} category="playing" items={[]} state="error" errorNode={<p role="alert">boom</p>} />)
  expect(screen.getByRole('alert')).toHaveTextContent('boom')
  expect(screen.getByRole('img', { name: '1 / 3' })).toBeInTheDocument()
  expect(screen.queryByTestId('grid')).not.toBeInTheDocument()
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
})

test('a game with no achievements says so instead of drawing an empty grid', () => {
  render(<LibraryGameDetail {...base} category="playing" items={[]} />)
  expect(screen.getByText('No achievements')).toBeInTheDocument()
  expect(screen.queryByTestId('grid')).not.toBeInTheDocument()
})
