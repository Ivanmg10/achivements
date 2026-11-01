import { render, screen, fireEvent } from '@testing-library/react'
import { GameAchievementsProgressChart } from './GameAchievementsProgressChart'
import type { InsightAchievement } from '@/utils/gameInsights'

// The real plot is recharts; this one has a button per bucket, like clicking its point.
jest.mock('@/components/achivements-line-chart/achievements-line-plot/AchievementsLinePlot', () => ({
  __esModule: true,
  default: ({ data, onPick, tick }: { data: { label: string; count: number }[]; onPick: (label: string) => void; tick: (label: string) => string }) => (
    <div data-testid="ResponsiveContainer">
      {data.map((d) => (
        <button key={d.label} onClick={() => onPick(d.label)} data-tick={tick(d.label)}>
          point {d.label} {d.count}
        </button>
      ))}
    </div>
  ),
}))

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function ach(id: string, earnedAt: string | null): InsightAchievement {
  return {
    id, title: `Achievement ${id}`, description: '', earned: !!earnedAt, earnedAt,
    rarity: null, points: null, kind: null, iconUrl: null, href: `/steamGame/1#ach-${id}`,
  }
}

const earned = ach('1', daysAgo(0))

test('renders the plot when there is earned achievement activity', async () => {
  render(<GameAchievementsProgressChart achievements={[earned]} />)
  expect(await screen.findByTestId('ResponsiveContainer')).toBeInTheDocument()
})

test('shows the empty state when nothing was earned in the period', () => {
  render(<GameAchievementsProgressChart achievements={[]} />)
  expect(screen.getByText('No achievements unlocked in this period')).toBeInTheDocument()
})

test('shows a loading skeleton while data is not ready', () => {
  const { container } = render(<GameAchievementsProgressChart achievements={[]} isLoading />)
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
})

test('toggles between weekly and monthly tabs', () => {
  render(<GameAchievementsProgressChart achievements={[earned]} />)
  const weekTab = screen.getByRole('button', { name: 'Weekly' })
  const monthTab = screen.getByRole('button', { name: 'Monthly' })
  expect(weekTab).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(monthTab)
  expect(monthTab).toHaveAttribute('aria-pressed', 'true')
  expect(weekTab).toHaveAttribute('aria-pressed', 'false')
})

test('draws no plot at all, so loads none, when there is nothing to draw or it is loading', () => {
  const { rerender } = render(<GameAchievementsProgressChart achievements={[]} />)
  expect(screen.queryByTestId('ResponsiveContainer')).not.toBeInTheDocument()
  rerender(<GameAchievementsProgressChart achievements={[earned]} isLoading />)
  expect(screen.queryByTestId('ResponsiveContainer')).not.toBeInTheDocument()
})

test('clicking a point lists what was unlocked that week, newest first, each linking to it', async () => {
  const older = ach('2', daysAgo(1))
  render(<GameAchievementsProgressChart achievements={[older, earned, ach('3', null), ach('4', daysAgo(30))]} />)
  fireEvent.click(await screen.findByRole('button', { name: /point .* 2$/ }))

  const dialog = await screen.findByRole('dialog', { name: /^Week of/ })
  const links = dialog.querySelectorAll('a')
  expect(links).toHaveLength(2)
  expect(links[0]).toHaveTextContent('Achievement 1')
  expect(links[0]).toHaveAttribute('href', '/steamGame/1#ach-1')
  expect(links[1]).toHaveTextContent('Achievement 2')

  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('a month opens titled by its name; a point with nothing opens nothing', async () => {
  render(<GameAchievementsProgressChart achievements={[earned]} />)
  fireEvent.click(screen.getByRole('button', { name: 'Monthly' }))
  const buttons = await screen.findAllByRole('button', { name: /^point/ })
  fireEvent.click(buttons[0])
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  fireEvent.click(buttons[buttons.length - 1])
  const month = new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })
  expect(await screen.findByRole('dialog', { name: new RegExp(month) })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
