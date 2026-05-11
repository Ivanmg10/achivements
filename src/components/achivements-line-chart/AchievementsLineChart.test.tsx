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
  { Date: recentDate(0) } as any,
  { Date: recentDate(1) } as any,
  { Date: recentDate(2) } as any,
]

test('renders line chart with recent achievements', () => {
  render(<AchievementsLineChart achievements={recentAchievements} />)
  expect(screen.getByTestId('ResponsiveContainer')).toBeInTheDocument()
})

test('renders no activity message with empty achievements', () => {
  render(<AchievementsLineChart achievements={[]} />)
  expect(screen.getByText('No activity this week')).toBeInTheDocument()
})

test('renders no activity message with only old achievements', () => {
  const old = [{ Date: '2020-01-01 00:00:00' } as any]
  render(<AchievementsLineChart achievements={old} />)
  expect(screen.getByText('No activity this week')).toBeInTheDocument()
})
