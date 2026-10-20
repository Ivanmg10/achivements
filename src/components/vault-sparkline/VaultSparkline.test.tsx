import { render, screen } from '@testing-library/react'
import VaultSparkline from './VaultSparkline'

test('draws the weeks as a line, the latest marked, and reads the numbers out', () => {
  const { container } = render(<VaultSparkline weeks={[0, 120, 40, 300]} />)
  expect(screen.getByRole('img')).toHaveAccessibleName('Points per week, last 4 weeks: 0, 120, 40, 300')
  expect(container.querySelector('polyline')?.getAttribute('points')?.split(' ')).toHaveLength(4)
  expect(container.querySelector('circle')).toBeInTheDocument()
})

test('nothing earned: a flat dashed line, no marker', () => {
  const { container } = render(<VaultSparkline weeks={[0, 0, 0]} />)
  expect(container.querySelector('polyline')).toBeNull()
  expect(container.querySelector('line')).toHaveAttribute('stroke-dasharray', '3 3')
})
