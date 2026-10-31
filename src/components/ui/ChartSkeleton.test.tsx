import { render } from '@testing-library/react'
import { ChartSkeleton } from './ChartSkeleton'

test('draws a bar per value, at that height, and no block', () => {
  const { container } = render(<ChartSkeleton bars={[10, 20]} />)
  const blocks = container.querySelectorAll('.bg-skeleton')
  expect(blocks).toHaveLength(2)
  expect(blocks[1]).toHaveStyle({ height: '20%' })
})

test('adds a label under each bar when the chart has them, and is decoration only', () => {
  const { container } = render(<ChartSkeleton bars={[10, 20]} labels />)
  expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(4)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
})
