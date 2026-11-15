import { render, screen } from '@testing-library/react'
import GroupListSkeleton from './GroupListSkeleton'

test('announces loading once and draws the cards the page has', () => {
  const { container } = render(<GroupListSkeleton />)

  expect(screen.getByRole('status')).toHaveTextContent('Loading your achievements')
  expect(container.querySelectorAll('[role="status"] > [aria-hidden="true"]')).toHaveLength(6)
})
