import { render, screen } from '@testing-library/react'
import AchievementsLineChart from './AchievementsLineChart'

jest.mock('@/components/day-achievements-modal/DayAchievementsModal', () => ({
  __esModule: true,
  default: () => null,
}))

function recentDate(daysAgo = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

const recentAchievements = [
  { Date: recentDate(0) } as never,
  { Date: recentDate(1) } as never,
  { Date: recentDate(2) } as never,
]

test('renders line chart with recent achievements', () => {
  render(<AchievementsLineChart achievements={recentAchievements} />)
  expect(screen.getByTestId('ResponsiveContainer')).toBeInTheDocument()
})

test('still renders the chart, flat at 0, with no achievements', () => {
  render(<AchievementsLineChart achievements={[]} />)
  expect(screen.getByTestId('ResponsiveContainer')).toBeInTheDocument()
  expect(screen.getByText('0 achievements in the last 7 days')).toBeInTheDocument()
})

test('still renders the chart, flat at 0, with only old achievements', () => {
  const old = [{ Date: '2020-01-01 00:00:00' } as never]
  render(<AchievementsLineChart achievements={old} />)
  expect(screen.getByTestId('ResponsiveContainer')).toBeInTheDocument()
})
