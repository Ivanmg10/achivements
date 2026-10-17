jest.mock('@/components/day-achievements-modal/DayAchievementsModal', () => ({
  __esModule: true,
  default: ({ date }: { date: string }) => <div data-testid="day-modal">{date}</div>,
}))
jest.mock('@/components/week-achievements-modal/WeekAchievementsModal', () => ({
  __esModule: true,
  default: ({ startDate }: { startDate: string }) => <div data-testid="week-modal">{startDate}</div>,
}))
jest.mock('@/components/period-achievements-modal/PeriodAchievementsModal', () => ({
  __esModule: true,
  default: ({ title, achievements }: { title: string; achievements: unknown[] }) => <div data-testid="month-modal">{`${title}:${achievements.length}`}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import MainPageBestPeriod from './MainPageBestPeriod'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

function ach(date: string, points: number, source?: 'steam'): RecentAchievement {
  return {
    Date: `${date} 12:00:00`, HardcoreMode: '0', AchievementID: Math.random(), Title: 't', Description: '', BadgeName: '',
    Points: points, GameID: 1, GameTitle: 'g', ConsoleName: 'SNES', ...(source ? { Source: source } : {}),
  }
}

function card(label: string) {
  return screen.getByText(label).closest('button')!
}

test('RA: the best periods are the ones with the most points', () => {
  // Jan 10 has one big unlock; Feb 3 has two small ones.
  render(<MainPageBestPeriod achievements={[ach('2024-01-10', 100), ach('2024-02-03', 5), ach('2024-02-03', 5)]} />)
  expect(card(en.cards.bestDay)).toHaveTextContent('100')
  expect(card(en.cards.bestDay)).toHaveTextContent('pts')
  expect(card(en.cards.bestMonth)).toHaveTextContent('2024-01')
})

test('Steam: the best periods are the ones with the most unlocks, shown as counts', () => {
  const list = [ach('2024-01-10', 0, 'steam'), ach('2024-02-03', 0, 'steam'), ach('2024-02-03', 0, 'steam')]
  render(<MainPageBestPeriod achievements={list} />)
  expect(card(en.cards.bestDay)).toHaveTextContent('2')
  expect(card(en.cards.bestDay)).toHaveTextContent(en.lineChart.achievements)
  expect(card(en.cards.bestDay)).not.toHaveTextContent('pts')
  expect(card(en.cards.bestMonth)).toHaveTextContent('2024-02')
})

test('opens the best day, week and month in a modal', () => {
  render(<MainPageBestPeriod achievements={[ach('2024-01-10', 10), ach('2024-01-12', 5), ach('2023-12-01', 1)]} />)
  fireEvent.click(card(en.cards.bestDay))
  expect(screen.getByTestId('day-modal')).toHaveTextContent('2024-01-10')
  fireEvent.click(card(en.cards.bestWeek))
  expect(screen.getByTestId('week-modal')).toBeInTheDocument()
  fireEvent.click(card(en.cards.bestMonth))
  // Only that month's unlocks, not December's.
  expect(screen.getByTestId('month-modal')).toHaveTextContent(`${en.cards.bestMonth} · 2024-01:2`)
})

test('says so without data, and shows placeholders while loading', () => {
  const { rerender } = render(<MainPageBestPeriod achievements={[]} />)
  expect(screen.getAllByText(en.cards.noData)).toHaveLength(3)
  rerender(<MainPageBestPeriod achievements={[]} isLoading />)
  expect(screen.queryByText(en.cards.noData)).not.toBeInTheDocument()
})
