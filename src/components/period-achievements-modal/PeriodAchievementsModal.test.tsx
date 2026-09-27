import { render, screen, fireEvent } from '@testing-library/react'
import PeriodAchievementsModal from './PeriodAchievementsModal'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

function ach(date: string, over: Partial<RecentAchievement> = {}): RecentAchievement {
  return {
    Date: `${date} 12:00:00`, HardcoreMode: '1', AchievementID: Math.random(), Title: 'Triforce', Description: '', BadgeName: '1',
    Points: 25, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES', ...over,
  }
}

test('lists RA unlocks by day under the given title, with points', () => {
  render(<PeriodAchievementsModal title="This week" achievements={[ach('2024-01-16'), ach('2024-01-17')]} onClose={jest.fn()} />)
  expect(screen.getByText('This week')).toBeInTheDocument()
  expect(screen.getAllByText('Triforce')).toHaveLength(2)
  expect(screen.getByText(`2 ${en.dayModal.achievements} · 50pts`)).toBeInTheDocument()
})

test('lists Steam unlocks as counts only', () => {
  const steam = ach('2024-01-16', { Title: 'Win', Points: 0, GameID: 620, BadgeName: '', Source: 'steam' })
  render(<PeriodAchievementsModal title="This week" achievements={[steam]} onClose={jest.fn()} />)
  expect(screen.getByRole('link', { name: /Win/ }).getAttribute('href')).toBe('/steamGame/620')
  expect(screen.queryByText(/pts/)).not.toBeInTheDocument()
})

test('says so when empty, and closes', () => {
  const onClose = jest.fn()
  render(<PeriodAchievementsModal title="This month" achievements={[]} onClose={onClose} />)
  expect(screen.getByText(en.cards.noData)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalled()
})
