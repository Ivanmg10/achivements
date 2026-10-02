import { render } from '@testing-library/react'
import { GameRowSkeleton } from './GameRowSkeleton'

test('is decoration only', () => {
  const { container } = render(<GameRowSkeleton className="extra" />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(container.firstElementChild).toHaveClass('extra')
})
