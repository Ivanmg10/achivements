import { render } from '@testing-library/react'
import { LineChartSkeleton } from './ChartSkeleton'

test('a line chart loads as a line with its seven days, and is decoration only', () => {
  const { container } = render(<LineChartSkeleton />)
  expect(container.querySelector('path')).toBeInTheDocument()
  expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(7)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
})
