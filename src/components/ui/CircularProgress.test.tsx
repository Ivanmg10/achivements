import { render, screen } from '@testing-library/react'
import { CircularProgress } from './CircularProgress'

test('renders earned/total in an accessible label plus a visible caption below', () => {
  render(<CircularProgress earned={4} total={10} label="Progress" />)
  expect(screen.getByRole('img', { name: '4 / 10' })).toBeInTheDocument()
  expect(screen.getByText('4/10')).toBeInTheDocument()
  expect(screen.getByText('Progress')).toBeInTheDocument()
})

test('shows completed state when earned equals total', () => {
  render(<CircularProgress earned={10} total={10} />)
  expect(screen.getByText('10/10')).toHaveClass('text-success')
})

test('handles a zero total without dividing by zero', () => {
  render(<CircularProgress earned={0} total={0} />)
  expect(screen.getByText('0/0')).toBeInTheDocument()
})

test('draws in the theme colour, and a finished one glows', () => {
  const { rerender } = render(<CircularProgress earned={3} total={10} />)
  expect(screen.getByRole('img')).not.toHaveAttribute('data-complete')
  expect(screen.getByRole('img').querySelectorAll('circle')[1].getAttribute('class')).toContain('stroke-progress')

  rerender(<CircularProgress earned={10} total={10} />)
  expect(screen.getByRole('img')).toHaveAttribute('data-complete', 'true')
  expect(screen.getByRole('img').querySelector('svg')!.getAttribute('style')).toContain('drop-shadow')
})
