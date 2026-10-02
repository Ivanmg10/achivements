import { render, screen } from '@testing-library/react'
import LandingNav from './LandingNav'

test('brand goes home and sign in goes to the auth page', () => {
  render(<LandingNav />)
  expect(screen.getByRole('link', { name: 'CheevoVault' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/authPage')
})
