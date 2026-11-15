import { render, screen } from '@testing-library/react'
import LandingClosing from './LandingClosing'
import { en } from '@/translations/en'

test('no card: the last line and the two ways in over the covers going by in two rows, opposite ways', () => {
  const { container } = render(<LandingClosing />)
  expect(screen.getByRole('heading', { level: 2, name: en.landing.closingTitle })).toBeInTheDocument()
  expect(screen.getByText(en.landing.closingText)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.landing.createAccount })).toHaveAttribute('href', '/authPage?mode=register')
  expect(screen.getByRole('link', { name: en.landing.signIn })).toHaveAttribute('href', '/authPage')
  const rows = container.querySelectorAll('.cover-reel-row')
  expect(rows).toHaveLength(2)
  expect(rows[1]).toHaveClass('cover-reel-back')
  expect(container.querySelector('.bg-bg-card')).toBeNull()
  expect(container.querySelector('[class*="mask-image"]')).toContainElement(rows[0] as HTMLElement)
})
