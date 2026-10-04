import { render, screen } from '@testing-library/react'
import StatusPageSkeleton from './StatusPageSkeleton'
import { en } from '@/translations/en'

test('announces loading once and hides the shapes', () => {
  const { container } = render(<StatusPageSkeleton />)
  expect(screen.getByRole('status')).toHaveTextContent(en.loadingPage.title)
  expect(container.querySelector('[role="status"] > [aria-hidden="true"]')).toBeInTheDocument()
})

test('keeps the grid the list will use, and does not cover the screen', () => {
  const { container } = render(<StatusPageSkeleton cols={3} />)
  expect(container.querySelector('.xl\\:grid-cols-3')).toBeInTheDocument()
  expect(container.querySelector('.fixed')).toBeNull()
})
