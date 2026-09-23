import { render, screen, fireEvent } from '@testing-library/react'
import WeekAchievementsModal from './WeekAchievementsModal'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

function ach(date: string, over: Partial<RecentAchievement> = {}): RecentAchievement {
  return {
    Date: `${date} 12:00:00`, HardcoreMode: '1', AchievementID: Math.random(), Title: 'Triforce', Description: '', BadgeName: '1',
    Points: 25, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES', ...over,
  }
}

test('lists the week’s RA unlocks by day, with points', () => {
  render(<WeekAchievementsModal startDate="2024-01-15" achievements={[ach('2024-01-16'), ach('2024-01-30')]} onClose={jest.fn()} />)
  expect(screen.getAllByText('Triforce')).toHaveLength(1)
  expect(screen.getByText(`1 ${en.dayModal.achievements} · 25pts`)).toBeInTheDocument()
})

test('lists Steam unlocks as counts only', () => {
  const steam = ach('2024-01-16', { Title: 'Win', Points: 0, GameID: 620, BadgeName: '', Source: 'steam', BadgeUrl: 'https://cdn/w.jpg' })
  render(<WeekAchievementsModal startDate="2024-01-15" achievements={[steam]} onClose={jest.fn()} />)
  expect(screen.getByRole('link', { name: /Win/ }).getAttribute('href')).toBe('/steamGame/620')
  expect(screen.queryByText(/pts/)).not.toBeInTheDocument()
})

test('says so for an empty week, and closes', () => {
  const onClose = jest.fn()
  render(<WeekAchievementsModal startDate="2024-03-04" achievements={[ach('2024-01-16')]} onClose={onClose} />)
  expect(screen.getByText(en.dayModal.empty)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalled()
})
