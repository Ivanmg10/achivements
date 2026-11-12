import { render, screen } from '@testing-library/react'
import SteamSignInButton from './SteamSignInButton'
import { en } from '@/translations/en'

test('is a plain link to the Steam sign-in route, dressed as the library\'s secondary button with Steam\'s mark', () => {
  render(<SteamSignInButton />)
  const link = screen.getByRole('link', { name: en.steamAuth.continue })
  expect(link).toHaveAttribute('href', '/api/auth/steam')
  expect(link).toHaveClass('w-full', 'min-h-12', 'before:ring-1')
  expect(screen.getByTestId('steam-logo')).toHaveClass('text-steam')
})

test('takes another label for the retry', () => {
  render(<SteamSignInButton label="Try again" />)
  expect(screen.getByRole('link', { name: 'Try again' })).toBeInTheDocument()
})
