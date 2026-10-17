jest.mock('../main-page-journal-day/MainPageJournalDay', () => ({
  __esModule: true,
  default: ({ day }: { day: { day: string; total: number } }) => <div data-testid="day">{`${day.day}:${day.total}`}</div>,
}))

import { render, screen } from '@testing-library/react'
import MainPageJournal from './MainPageJournal'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

const at = (local: Date) => ({ Date: local.toISOString().replace('T', ' ').slice(0, 19), GameID: 1, GameTitle: 'G', ConsoleName: 'PS4' }) as RecentAchievement

test('the last three days with unlocks, newest first', () => {
  const list = [12, 13, 14, 15, 16, 16].map((d) => at(new Date(2026, 9, d, 12)))
  render(<MainPageJournal achievements={list} />)
  expect(screen.getByText(en.cards.journal)).toBeInTheDocument()
  expect(screen.getAllByTestId('day').map((d) => d.textContent)).toEqual(['2026-10-16:2', '2026-10-15:1', '2026-10-14:1'])
})

test('nothing unlocked yet', () => {
  render(<MainPageJournal achievements={[]} />)
  expect(screen.getByText(en.cards.noData)).toBeInTheDocument()
})
