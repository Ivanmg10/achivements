import { render, screen } from '@testing-library/react'
import LandingNav from './LandingNav'

test('brand goes home and sign in goes to the auth page', () => {
  render(<LandingNav />)
  expect(screen.getByRole('link', { name: 'CheevoVault' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/authPage')
})

test('the bar is the narrow centred one, or, for a full-width page, as wide as its content', () => {
  const { rerender } = render(<LandingNav />)
  expect(screen.getByRole('navigation')).toHaveClass('max-w-6xl', 'mx-auto')
  rerender(<LandingNav wide />)
  expect(screen.getByRole('navigation')).toHaveClass('w-full')
  expect(screen.getByRole('navigation')).not.toHaveClass('max-w-6xl')
})
