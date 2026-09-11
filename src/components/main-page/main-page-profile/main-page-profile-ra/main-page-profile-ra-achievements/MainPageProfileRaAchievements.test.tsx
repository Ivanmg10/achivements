import { render, screen } from '@testing-library/react'
import MainPageProfileRaAchievements from './MainPageProfileRaAchievements'
import { RecentAchievement } from '@/types/types'

const achievements = [
  { AchievementID: 1, GameID: 10, GameTitle: 'Sly Cooper', Title: 'Master Thief', BadgeName: 'badge', Points: 25, HardcoreMode: '0' },
] as RecentAchievement[]

test('renders the achievement list when there is data', () => {
  render(<MainPageProfileRaAchievements achievements={achievements} />)
  expect(screen.getByText('Master Thief')).toBeInTheDocument()
})

test('renders a loading skeleton instead of the empty state while loading with no data yet', () => {
  const { container } = render(<MainPageProfileRaAchievements achievements={[]} isLoading />)
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  expect(screen.queryByText('No achievements earned yet')).not.toBeInTheDocument()
})

test('renders a reserved-height empty state instead of collapsing when there is no data', () => {
  const { container } = render(<MainPageProfileRaAchievements achievements={[]} isLoading={false} />)
  expect(screen.getByText('No achievements earned yet')).toBeInTheDocument()
  expect(container.firstChild).toHaveClass('min-h-[220px]')
})
