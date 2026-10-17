import { render, screen } from '@testing-library/react'
import MainPageJournalDay from './MainPageJournalDay'
import type { JournalDay } from '@/utils/activityInsights'
import type { RecentAchievement } from '@/types/types'

const game = (gameId: number, title: string, count: number, source: 'ra' | 'psn' = 'ra') => ({
  source, gameId, title, console: 'PS4', count, sample: { GameIconUrl: `https://${gameId}.png` } as RecentAchievement,
})

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(2026, 9, 17, 12))
})
afterEach(() => jest.useRealTimers())

test('today, its count, and its games linking to their pages', () => {
  const day: JournalDay = { day: '2026-10-17', total: 3, games: [game(7423, 'Colosseum', 2), game(2018800, 'BO2', 1, 'psn')] }
  render(<MainPageJournalDay day={day} />)
  expect(screen.getByText('today')).toBeInTheDocument()
  expect(screen.getByText('3 achievements')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Colosseum/ })).toHaveAttribute('href', '/gameInfo/7423')
  expect(screen.getByRole('link', { name: /BO2/ })).toHaveAttribute('href', '/psnGame/NPWR20188_00')
})

test('yesterday by name, older days by date, and the games past two counted', () => {
  const { rerender } = render(<MainPageJournalDay day={{ day: '2026-10-16', total: 1, games: [game(1, 'A', 1)] }} />)
  expect(screen.getByText('yesterday')).toBeInTheDocument()
  rerender(<MainPageJournalDay day={{ day: '2026-10-12', total: 4, games: [game(1, 'A', 1), game(2, 'B', 1), game(3, 'C', 1), game(4, 'D', 1)] }} />)
  expect(screen.getByText('Mon, Oct 12')).toBeInTheDocument()
  expect(screen.getAllByRole('link')).toHaveLength(2)
  expect(screen.getByText('+2 games')).toBeInTheDocument()
})
