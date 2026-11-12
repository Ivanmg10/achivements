import { render } from '@testing-library/react'
import StreakCalendarSkeleton from './StreakCalendarSkeleton'

test('the weekday row, eight weeks of days and the day panel, hidden from screen readers', () => {
  const { container } = render(<StreakCalendarSkeleton />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(container.querySelectorAll('.aspect-square')).toHaveLength(56)
  expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(7 + 56 + 2)
})
