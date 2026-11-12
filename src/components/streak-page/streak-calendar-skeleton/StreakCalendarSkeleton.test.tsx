import { render } from '@testing-library/react'
import StreakCalendarSkeleton from './StreakCalendarSkeleton'

test('the calendar\'s shape: seven rows of ten weeks, the weekdays, a month, the legend and the day panel, hidden from screen readers', () => {
  const { container } = render(<StreakCalendarSkeleton />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  const days = [...container.querySelectorAll<HTMLElement>('.aspect-square')]
  expect(days).toHaveLength(70)
  expect(new Set(days.map((d) => d.style.gridRow)).size).toBe(7)
  expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(1 + 7 + 70 + 2)
})
