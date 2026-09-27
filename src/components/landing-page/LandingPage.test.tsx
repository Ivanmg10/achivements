import { render, screen } from '@testing-library/react'
import LandingPage from './LandingPage'
import { en } from '@/translations/en'

jest.mock('@/components/auth-collage-panel/AuthCollagePanel', () => ({
  __esModule: true,
  default: () => <div data-testid="collage" />,
}))
jest.mock('@/components/version-badge/VersionBadge', () => ({ __esModule: true, default: () => null }))

test('says what the app is, in one heading and one paragraph', () => {
  render(<LandingPage />)
  expect(screen.getByRole('heading', { level: 1, name: en.landing.tagline })).toBeInTheDocument()
  expect(screen.getByText(en.landing.intro)).toBeInTheDocument()
})

test('offers both ways in, pointing at the auth page', () => {
  render(<LandingPage />)
  const create = screen.getAllByRole('link', { name: new RegExp(en.landing.createAccount) })
  expect(create.length).toBeGreaterThan(0)
  for (const link of create) expect(link.getAttribute('href')).toBe('/authPage?mode=register')
  expect(screen.getByRole('link', { name: en.landing.signIn }).getAttribute('href')).toBe('/authPage')
})

test('names the platforms it follows, PlayStation as still coming', () => {
  render(<LandingPage />)
  expect(screen.getByText('RetroAchievements')).toBeInTheDocument()
  expect(screen.getByText('Steam')).toBeInTheDocument()
  expect(screen.getByText(en.landing.psnSoon)).toBeInTheDocument()
})

test('lists what you get, one card each', () => {
  render(<LandingPage />)
  for (const title of [en.landing.libraryTitle, en.landing.organiseTitle, en.landing.progressTitle]) {
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
  }
})

test('the art wall is decoration, hidden from assistive tech', () => {
  const { container } = render(<LandingPage />)
  expect(screen.getByTestId('collage').closest('[aria-hidden="true"]')).not.toBeNull()
  expect(container.querySelector('footer')).toHaveTextContent(en.landing.footer)
})
