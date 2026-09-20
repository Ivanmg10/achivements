import { render, screen } from '@testing-library/react'
import MainSidePanelLastAchievement from './MainSidePanelLastAchievement'
import { RecentAchievement } from '@/types/types'

const achievement = {
  AchievementID: 1,
  GameID: 10,
  GameTitle: 'Sly Cooper',
  Title: 'Master Thief',
  BadgeName: 'badge',
  Points: 25,
  HardcoreMode: '0',
} as RecentAchievement

test('renders the achievement when one is given', () => {
  render(<MainSidePanelLastAchievement achievement={achievement} />)
  expect(screen.getByText('Master Thief')).toBeInTheDocument()
  expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
  expect(screen.getByText('25 pts')).toBeInTheDocument()
})

test('shows a loading skeleton instead of an empty state while loading', () => {
  const { container } = render(<MainSidePanelLastAchievement achievement={null} isLoading />)
  expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  expect(screen.queryByText('No achievements earned yet')).not.toBeInTheDocument()
})

test('shows an empty state with reserved space when there is no achievement and loading finished', () => {
  render(<MainSidePanelLastAchievement achievement={null} isLoading={false} />)
  expect(screen.getByText('No achievements earned yet')).toBeInTheDocument()
})
