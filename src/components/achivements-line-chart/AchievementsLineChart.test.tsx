import { render, screen } from '@testing-library/react'
import AchievementsLineChart from './AchievementsLineChart'
import { en } from '@/translations/en'

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

test('renders the week as a line, with its total and its best day', () => {
  render(<AchievementsLineChart achievements={recentAchievements} />)
  expect(screen.getByTestId('ResponsiveContainer')).toBeInTheDocument()
  expect(screen.getByTestId('AreaChart')).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()
  expect(screen.getByText(en.lineChart.bestDay.replace('{n}', '1'))).toBeInTheDocument()
})

test('RA and Steam make one line; the split is in the tooltip', () => {
  render(<AchievementsLineChart achievements={[...recentAchievements, { Date: recentDate(0), Source: 'steam' } as never]} />)
  expect(screen.getAllByTestId('Area')).toHaveLength(1)
  expect(screen.getByText('4')).toBeInTheDocument()
})

test('still renders the chart, flat at 0, with no achievements', () => {
  render(<AchievementsLineChart achievements={[]} />)
  expect(screen.getByTestId('ResponsiveContainer')).toBeInTheDocument()
  expect(screen.getByText('0')).toBeInTheDocument()
  expect(screen.getByText(en.lineChart.last7Days)).toBeInTheDocument()
  expect(screen.queryByText(en.lineChart.bestDay.replace('{n}', '0'))).not.toBeInTheDocument()
})

test('still renders the chart, flat at 0, with only old achievements', () => {
  const old = [{ Date: '2020-01-01 00:00:00' } as never]
  render(<AchievementsLineChart achievements={old} />)
  expect(screen.getByTestId('ResponsiveContainer')).toBeInTheDocument()
})

test('one unlock is said in the singular', () => {
  render(<AchievementsLineChart achievements={[{ Date: recentDate(0) } as never]} />)
  expect(screen.getByText(en.lineChart.last7DaysOne)).toBeInTheDocument()
})
