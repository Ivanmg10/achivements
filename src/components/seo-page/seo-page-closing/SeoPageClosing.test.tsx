import { render, screen } from '@testing-library/react'
import SeoPageClosing from './SeoPageClosing'
import { en } from '@/translations/en'

test('is a line and a button to the register form, not a card', () => {
  const { container } = render(<SeoPageClosing />)
  expect(screen.getByText(en.landing.closingTitle)).toBeInTheDocument()
  expect(screen.getByText(en.landing.closingText)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: new RegExp(en.landing.createAccount) })).toHaveAttribute('href', '/authPage?mode=register')
  expect(container.firstElementChild).not.toHaveClass('bg-bg-card')
  expect(container.firstElementChild!.className).not.toMatch(/shadow|radial|rounded-card/)
})
