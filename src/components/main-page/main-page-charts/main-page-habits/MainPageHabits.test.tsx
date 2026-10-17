import { render, screen } from '@testing-library/react'
import MainPageHabits from './MainPageHabits'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

// Built in local time and sent as UTC, as the feed does, so the test holds in any time zone.
const at = (local: Date) => ({ Date: local.toISOString().replace('T', ' ').slice(0, 19) }) as RecentAchievement

test('says when the person plays most, with a bar per weekday and per hour', () => {
  // 2026-10-18 is a Sunday.
  const list = [18, 19, 19, 20].map((h) => at(new Date(2026, 9, 18, h)))
  const { container } = render(<MainPageHabits achievements={list} />)
  expect(screen.getByText(en.cards.habits)).toBeInTheDocument()
  expect(screen.getByText(en.cards.habitsPeak.replace('{day}', 'Sunday').replace('{from}', '18:00').replace('{to}', '21:00'))).toBeInTheDocument()
  // 7 weekdays and 24 hours.
  expect(container.querySelectorAll('[title]')).toHaveLength(31)
  expect(container.querySelector('[title="Sunday · 4"] > span')).toHaveClass('bg-accent')
  expect(container.querySelector('[title="Monday · 0"] > span')).toHaveClass('bg-accent/30')
  // The busiest three hours stand out, the rest do not.
  expect(container.querySelector('[title="19:00 · 2"] > span')).toHaveClass('bg-accent')
  expect(container.querySelector('[title="21:00 · 0"] > span')).toHaveClass('bg-accent/30')
})

test('nothing unlocked yet', () => {
  render(<MainPageHabits achievements={[]} />)
  expect(screen.getByText(en.cards.noData)).toBeInTheDocument()
})

test('a placeholder while loading', () => {
  const { container } = render(<MainPageHabits achievements={[]} isLoading />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
})
