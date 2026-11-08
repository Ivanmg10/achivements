import { render, screen } from '@testing-library/react'
import Spinner from './Spinner'
import Button from './Button'

test('a spinner is decorative, in the colour of its text, and still under reduced motion', () => {
  const { container } = render(<Spinner size="sm" />)
  const el = container.firstElementChild!
  expect(el).toHaveAttribute('aria-hidden', 'true')
  expect(el).toHaveClass('border-current', 'animate-spin', 'motion-reduce:animate-none', 'w-3')
})

test('a loading button draws it, keeps its words and blocks itself', () => {
  render(<Button loading>Saving…</Button>)
  const button = screen.getByRole('button', { name: 'Saving…' })
  expect(button).toBeDisabled()
  expect(button.querySelector('.animate-spin')).toBeInTheDocument()
})
