import { render } from '@testing-library/react'
import StreakCalendarSkeleton from './StreakCalendarSkeleton'

const wide = { current: true }
jest.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: () => wide.current }))

const days = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('.aspect-square')]

test('the calendar\'s shape on a wide screen: seven rows of thirteen weeks, hidden from screen readers', () => {
  wide.current = true
  const { container } = render(<StreakCalendarSkeleton />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(days(container)).toHaveLength(91)
  expect(new Set(days(container).map((d) => d.style.gridRow)).size).toBe(7)
  // The weeks' buttons, a month, seven weekdays, the days, the legend and the day panel.
  expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(1 + 1 + 7 + 91 + 2)
})

test('seven weeks on a phone', () => {
  wide.current = false
  const { container } = render(<StreakCalendarSkeleton />)
  expect(days(container)).toHaveLength(49)
})
