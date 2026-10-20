import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

test('is decorative, with its icon and the badge on its corner', () => {
  const { container } = render(<StatusBadge icon={<i data-testid="icon" />} corner={<i data-testid="corner" />} />)
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByTestId('icon')).toBeInTheDocument()
  expect(screen.getByTestId('corner')).toBeInTheDocument()
})

test('takes the accent by default and red for an error', () => {
  const { container, rerender } = render(<StatusBadge icon={null} corner={null} />)
  expect(container.innerHTML).toContain('text-accent')
  rerender(<StatusBadge icon={null} corner={null} tone="danger" />)
  expect(container.innerHTML).toContain('text-danger')
  expect(container.innerHTML).not.toContain('text-accent')
})
