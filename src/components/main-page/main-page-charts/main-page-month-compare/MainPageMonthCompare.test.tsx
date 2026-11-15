import { render, screen } from '@testing-library/react'
import MainPageMonthCompare from './MainPageMonthCompare'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

const at = (local: Date, GameID = 1) => ({ Date: local.toISOString().replace('T', ' ').slice(0, 19), GameID }) as RecentAchievement

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(2026, 9, 17, 12))
})
afterEach(() => jest.useRealTimers())

test('this month so far against the same days of last month, with the change of each', () => {
  const list = [at(new Date(2026, 9, 2), 1), at(new Date(2026, 9, 3), 2), at(new Date(2026, 9, 3), 2), at(new Date(2026, 8, 4), 3)]
  render(<MainPageMonthCompare achievements={list} />)
  expect(screen.getByText(en.cards.monthCompare)).toBeInTheDocument()
  expect(screen.getByText(/^vs Sep 1/)).toBeInTheDocument()
  const tile = (label: string) => screen.getByText(label).closest('div')!
  expect(tile(en.cards.monthUnlocks)).toHaveTextContent('3+2')
  expect(tile(en.cards.monthGames)).toHaveTextContent('2+1')
  expect(tile(en.cards.monthDays)).toHaveTextContent('2+1')
})

test('a month going worse says so with a minus', () => {
  render(<MainPageMonthCompare achievements={[at(new Date(2026, 8, 4)), at(new Date(2026, 8, 5))]} />)
  expect(screen.getByText(en.cards.monthUnlocks).closest('div')).toHaveTextContent('0-2')
})

test('blocks in the figures\' place while loading', () => {
  const { container } = render(<MainPageMonthCompare achievements={[]} isLoading />)
  expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(3)
})
