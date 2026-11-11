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
