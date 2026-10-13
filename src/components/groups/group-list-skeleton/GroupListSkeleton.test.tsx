import { render, screen } from '@testing-library/react'
import GroupListSkeleton from './GroupListSkeleton'

test('announces loading once and draws three card shapes', () => {
  const { container } = render(<GroupListSkeleton />)

  expect(screen.getByRole('status')).toHaveTextContent('Loading your achievements')
  expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3)
})
