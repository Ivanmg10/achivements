import { render, screen } from '@testing-library/react'
import AuthTitle from './AuthTitle'

test('is the page heading, in the display italic', () => {
  render(<AuthTitle>Sign in</AuthTitle>)
  expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toHaveClass('font-display', 'italic')
})
