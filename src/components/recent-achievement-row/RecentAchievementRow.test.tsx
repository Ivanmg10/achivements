import { render, screen, fireEvent } from '@testing-library/react'
import RecentAchievementRow from './RecentAchievementRow'
import type { RecentAchievement } from '@/types/types'

const RA: RecentAchievement = {
  Date: '2024-01-15 12:00:00', HardcoreMode: '1', AchievementID: 1, Title: 'Triforce', Description: '', BadgeName: '123',
  Points: 25, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES',
}

test('an RA unlock links to the RA page, with its badge and points', () => {
  render(<RecentAchievementRow ach={RA} onNavigate={jest.fn()} />)
  expect(screen.getByRole('link').getAttribute('href')).toBe('/gameInfo/1')
  expect(screen.getByRole('img', { name: 'Triforce' }).getAttribute('src')).toBe('https://media.retroachievements.org/Badge/123.png')
  expect(screen.getByText('25pts').className).toContain('text-warning')
})

test('a Steam unlock links to the Steam page, with its full badge URL and no points', () => {
  const steam = { ...RA, Title: 'Win', GameID: 620, BadgeName: '', Points: 0, Source: 'steam' as const, BadgeUrl: 'https://cdn/w.jpg' }
  render(<RecentAchievementRow ach={steam} onNavigate={jest.fn()} />)
  expect(screen.getByRole('link').getAttribute('href')).toBe('/steamGame/620')
  expect(screen.getByRole('img', { name: 'Win' }).getAttribute('src')).toBe('https://cdn/w.jpg')
  expect(screen.queryByText(/pts$/)).not.toBeInTheDocument()
})

test('shows a placeholder without a badge, and reports navigation', () => {
  const onNavigate = jest.fn()
  const { container } = render(<RecentAchievementRow ach={{ ...RA, BadgeName: '' }} onNavigate={onNavigate} />)
  expect(container.querySelector('img')).toBeNull()
  fireEvent.click(screen.getByRole('link'))
  expect(onNavigate).toHaveBeenCalled()
})
