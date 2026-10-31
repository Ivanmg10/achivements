import { render, screen } from '@testing-library/react'
import UserPageSkeleton from './UserPageSkeleton'

test('announces loading once and hides the shapes', () => {
  const { container } = render(<UserPageSkeleton />)

  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  expect(screen.getByRole('status')).toHaveTextContent('Loading your achievements')
  expect(container.querySelectorAll('[role="status"] > [aria-hidden="true"]')).toHaveLength(1)
})
