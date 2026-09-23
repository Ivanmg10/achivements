jest.mock('@/hooks/useUserAwards', () => ({ useUserAwards: jest.fn() }))

import { render, screen, fireEvent } from '@testing-library/react'
import DayAchievementsModal from './DayAchievementsModal'
import { useUserAwards } from '@/hooks/useUserAwards'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

const DAY = '2024-01-15'

function ach(over: Partial<RecentAchievement> = {}): RecentAchievement {
  return {
    Date: `${DAY} 12:00:00`, HardcoreMode: '1', AchievementID: 1, Title: 'Triforce', Description: '', BadgeName: '123',
    Points: 25, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES', ...over,
  }
}

const MASTERY = {
  AwardType: 'Mastery/Completion', AwardData: 1, AwardDataExtra: 1, AwardedAt: `${DAY}T12:00:00Z`,
  Title: 'Zelda', ConsoleName: 'SNES', ImageIcon: '/Images/1.png',
}

beforeEach(() => {
  ;(useUserAwards as jest.Mock).mockReturnValue({ awards: { VisibleUserAwards: [MASTERY] } })
})

test('lists the day’s RA unlocks with points and the day’s mastery awards', () => {
  render(<DayAchievementsModal date={DAY} achievements={[ach(), ach({ AchievementID: 2, Date: '2024-01-16 10:00:00' })]} onClose={jest.fn()} />)
  expect(screen.getByText('Triforce')).toBeInTheDocument()
  expect(screen.getByText('25pts')).toBeInTheDocument()
  expect(screen.getByText(en.streak.mastery)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Triforce/ }).getAttribute('href')).toBe('/gameInfo/1')
  expect(screen.getByRole('img', { name: 'Triforce' }).getAttribute('src')).toBe('https://media.retroachievements.org/Badge/123.png')
})

test('mixes Steam unlocks in: no points for them, and RA awards still show', () => {
  const steam = ach({ Title: 'Win', GameID: 620, GameTitle: 'Portal 2', Points: 0, BadgeName: '', Source: 'steam', BadgeUrl: 'https://cdn/win.jpg' })
  render(<DayAchievementsModal date={DAY} achievements={[ach(), steam]} onClose={jest.fn()} />)
  expect(screen.queryByText('0pts')).not.toBeInTheDocument()
  expect(screen.getByText('25pts')).toBeInTheDocument()
  expect(screen.getByText(en.streak.mastery)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Win/ }).getAttribute('href')).toBe('/steamGame/620')
  expect(screen.getByRole('img', { name: 'Win' }).getAttribute('src')).toBe('https://cdn/win.jpg')
})

test('says so on an empty day, and closes', () => {
  ;(useUserAwards as jest.Mock).mockReturnValue({ awards: null })
  const onClose = jest.fn()
  render(<DayAchievementsModal date="2024-02-01" achievements={[ach()]} onClose={onClose} />)
  expect(screen.getByText(en.dayModal.empty)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalled()
})
