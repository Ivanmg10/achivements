import { render, screen } from '@testing-library/react'
import LandingHero from './LandingHero'
import { en } from '@/translations/en'

jest.mock('@/components/auth-collage-panel/AuthCollagePanel', () => ({
  __esModule: true,
  default: () => <div data-testid="collage" />,
}))

test('one heading, one paragraph and one way to start', () => {
  render(<LandingHero />)
  expect(screen.getByRole('heading', { level: 1, name: en.landing.tagline })).toBeInTheDocument()
  expect(screen.getByText(en.landing.intro)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.landing.createAccount })).toHaveAttribute('href', '/authPage?mode=register')
})

test('the art window is decoration', () => {
  render(<LandingHero />)
  expect(screen.getByTestId('collage').closest('[aria-hidden="true"]')).not.toBeNull()
})
