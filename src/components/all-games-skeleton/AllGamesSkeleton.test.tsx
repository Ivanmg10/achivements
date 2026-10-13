import { render, screen } from '@testing-library/react'
import AllGamesSkeleton from './AllGamesSkeleton'

test('announces loading once and draws the three sections', () => {
  const { container } = render(<AllGamesSkeleton />)

  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  expect(container.querySelectorAll('.bg-bg-card')).toHaveLength(3)
})
