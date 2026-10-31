jest.mock('@/hooks/useXboxSummary', () => ({ useXboxSummary: jest.fn() }))
jest.mock('@/components/day-achievements-modal/DayAchievementsModal', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <div data-testid="day-modal">{date}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import MainPageXboxStats from './MainPageXboxStats'
import { useXboxSummary } from '@/hooks/useXboxSummary'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

const today = new Date().toISOString().split('T')[0]
const unlock = (date: string) => ({ Date: `${date} 12:00:00`, Source: 'xbox', Title: 'A', GameTitle: 'G', GameID: 1, AchievementID: 1 }) as RecentAchievement

beforeEach(() => {
  ;(useXboxSummary as jest.Mock).mockReturnValue({ summary: { gamerscore: 10242, achievementsUnlocked: 593 } })
})

test("today's achievements, the gamerscore and the total unlocked", () => {
  render(<MainPageXboxStats streak={0} achievements={[unlock(today), unlock(today)]} />)
  expect(screen.getByText(en.pointsStats.today).parentElement).toHaveTextContent('2')
  expect(screen.getByText('10,242')).toBeInTheDocument()
  expect(screen.getByText('593')).toBeInTheDocument()
})

test('a running streak, in the theme colour', () => {
  render(<MainPageXboxStats streak={8} achievements={[]} />)
  expect(screen.getByText('8d')).toHaveClass('text-accent')
})

test('without a summary yet, only what the achievements say', () => {
  ;(useXboxSummary as jest.Mock).mockReturnValue({ summary: null })
  render(<MainPageXboxStats streak={0} achievements={[unlock(today)]} />)
  expect(screen.queryByText(en.xbox.gamerscore)).not.toBeInTheDocument()
})

test('placeholders while loading', () => {
  render(<MainPageXboxStats streak={0} achievements={[]} isLoading />)
  expect(document.querySelectorAll('.bg-skeleton').length).toBeGreaterThan(3)
})

test("the day's pill opens what was earned that day", () => {
  render(<MainPageXboxStats streak={0} achievements={[unlock(today)]} />)
  fireEvent.click(screen.getByText(en.pointsStats.today).closest('button')!)
  expect(screen.getByTestId('day-modal')).toHaveTextContent(today)
})
