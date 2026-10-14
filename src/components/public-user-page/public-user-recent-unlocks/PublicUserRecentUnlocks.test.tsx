import { render, screen } from '@testing-library/react'
import PublicUserRecentUnlocks from './PublicUserRecentUnlocks'
import { useStreakData } from '@/hooks/useStreakData'
import { en } from '@/translations/en'

jest.mock('@/hooks/useStreakData', () => ({ useStreakData: jest.fn() }))
jest.mock('@/components/recent-achievement-row/RecentAchievementRow', () => ({
  __esModule: true,
  default: ({ ach }: { ach: { Title: string } }) => <span>{ach.Title}</span>,
}))

const ach = (i: number) => ({ Date: `2026-10-${String(13 - i).padStart(2, '0')} 10:00:00`, AchievementID: i, GameID: 1, Title: `A${i}` })

test('the latest eight, newest first', () => {
  ;(useStreakData as jest.Mock).mockReturnValue({ achievements: Array.from({ length: 10 }, (_, i) => ach(i)), isLoading: false })
  render(<PublicUserRecentUnlocks />)
  expect(screen.getAllByRole('listitem')).toHaveLength(8)
  expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('A0')
})

test('nothing in a year says so', () => {
  ;(useStreakData as jest.Mock).mockReturnValue({ achievements: [], isLoading: false })
  render(<PublicUserRecentUnlocks />)
  expect(screen.getByText(en.userProfile.noRecentUnlocks)).toBeInTheDocument()
})

test('a placeholder while loading', () => {
  ;(useStreakData as jest.Mock).mockReturnValue({ achievements: [], isLoading: true })
  render(<PublicUserRecentUnlocks />)
  expect(screen.queryByText(en.userProfile.noRecentUnlocks)).not.toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})
