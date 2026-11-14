import { render, screen } from '@testing-library/react'
import PeriodAchievementsGameGroup from './PeriodAchievementsGameGroup'
import { groupGames } from '@/utils/periodDays'
import type { RecentAchievement } from '@/types/types'

let id = 0
const ach = (over: Partial<RecentAchievement> = {}): RecentAchievement => ({
  Date: '2020-01-16 12:00:00', HardcoreMode: '1', AchievementID: ++id, Title: `T${id}`, Description: '', BadgeName: '1',
  Points: 10, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES', GameIcon: '/Images/z.png', ...over,
})

test('names the game once with its cover, console and count, over one link per achievement', () => {
  const [group] = groupGames([ach(), ach()])
  const { container } = render(<PeriodAchievementsGameGroup group={group} onNavigate={jest.fn()} />)
  expect(screen.getByRole('heading', { name: 'Zelda' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Zelda' })).toHaveTextContent('SNES, 2 achievements')
  expect(container.querySelector('img[src$="/Images/z.png"]')).not.toBeNull()
  expect(screen.getAllByRole('link')).toHaveLength(2)
  expect(screen.getAllByText('Zelda')).toHaveLength(1)
})

test('a platform without its own console names the platform, and a game without a cover has a placeholder', () => {
  const [group] = groupGames([ach({ Source: 'steam', GameID: 620, GameTitle: 'Portal 2', Points: 0, GameIcon: undefined })])
  const { container } = render(<PeriodAchievementsGameGroup group={group} onNavigate={jest.fn()} />)
  expect(screen.getByRole('region', { name: 'Portal 2' })).toHaveTextContent('Steam, 1 achievement')
  expect(container.querySelector('img[src*="z.png"]')).toBeNull()
})
