import { fireEvent, render, screen } from '@testing-library/react'
import PeriodAchievementsDays from './PeriodAchievementsDays'
import { groupDays } from '@/utils/periodDays'
import type { RecentAchievement } from '@/types/types'

let id = 0
const ach = (date: string): RecentAchievement => ({
  Date: `${date} 12:00:00`, HardcoreMode: '1', AchievementID: ++id, Title: 'T', Description: '', BadgeName: '1',
  Points: 10, GameID: 1, GameTitle: 'Zelda', ConsoleName: 'SNES',
})

const days = groupDays([ach('2020-01-16'), ach('2020-01-16'), ach('2020-01-16'), ach('2020-01-15'), ach('2020-01-15')])

test('one row per day with its weekday and date, its count and a bar as long as its share of the busiest day', () => {
  const { container } = render(<PeriodAchievementsDays days={days} selected="2020-01-16" onSelect={jest.fn()} />)
  const rows = screen.getAllByRole('button')
  expect(rows[0]).toHaveTextContent('Thursday, Jan 16, 20203 achievements')
  expect(rows[1]).toHaveTextContent('Wednesday, Jan 15, 20202 achievements')
  const bars = [...container.querySelectorAll<HTMLElement>('button [aria-hidden="true"] > [aria-hidden="true"]')]
  expect(bars.map((b) => b.style.width)).toEqual(['max(3px, 100%)', `max(3px, ${(2 / 3) * 100}%)`])
})

test('the chosen day is pressed and carries the mark, the others keep its room', () => {
  render(<PeriodAchievementsDays days={days} selected="2020-01-15" onSelect={jest.fn()} />)
  const [first, second] = screen.getAllByRole('button')
  expect(first).toHaveAttribute('aria-pressed', 'false')
  expect(second).toHaveAttribute('aria-pressed', 'true')
  expect(first.querySelector('.invisible')).not.toBeNull()
  expect(second.querySelector('.invisible')).toBeNull()
})

test('clicking a day chooses it', () => {
  const onSelect = jest.fn()
  render(<PeriodAchievementsDays days={days} selected="2020-01-16" onSelect={onSelect} />)
  fireEvent.click(screen.getAllByRole('button')[1])
  expect(onSelect).toHaveBeenCalledWith('2020-01-15')
})

test('the mark has its usual gap before the weekday (#165, H5)', () => {
  render(<PeriodAchievementsDays days={days} selected="2020-01-16" onSelect={jest.fn()} />)
  const mark = screen.getAllByRole('button')[0].querySelector('[aria-hidden="true"].font-extrabold')!
  expect(mark.parentElement).toHaveClass('gap-1.5')
})
