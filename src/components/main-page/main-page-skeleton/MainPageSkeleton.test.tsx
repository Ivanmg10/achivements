import { render, screen } from '@testing-library/react'
import MainPageSkeleton from './MainPageSkeleton'

test('announces loading once and hides the shapes', () => {
  const { container } = render(<MainPageSkeleton />)
  expect(screen.getByRole('status')).toHaveTextContent('Loading your achievements')
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  const shapes = container.querySelectorAll('[role="status"] > [aria-hidden="true"]')
  expect(shapes.length).toBeGreaterThan(0)
})

test('does not cover the screen', () => {
  const { container } = render(<MainPageSkeleton />)
  expect(container.querySelector('.fixed')).toBeNull()
})
