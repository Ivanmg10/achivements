import { render, screen, fireEvent } from '@testing-library/react'
import { GameAchievementsProgressChart } from './GameAchievementsProgressChart'
import { RetroAchievement } from '@/types/types'

function recentDate(daysAgo = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

const earned = {
  ID: 1,
  DateEarned: recentDate(1),
  DateEarnedHardcore: recentDate(1),
} as RetroAchievement

test('renders bar chart when there is earned achievement activity', () => {
  render(<GameAchievementsProgressChart achievements={[earned]} />)
  expect(screen.getByTestId('ResponsiveContainer')).toBeInTheDocument()
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
  const weekTab = screen.getByRole('tab', { name: 'Weekly' })
  const monthTab = screen.getByRole('tab', { name: 'Monthly' })
  expect(weekTab).toHaveAttribute('aria-selected', 'true')
  fireEvent.click(monthTab)
  expect(monthTab).toHaveAttribute('aria-selected', 'true')
  expect(weekTab).toHaveAttribute('aria-selected', 'false')
})
