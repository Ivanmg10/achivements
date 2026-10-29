import { render, screen, fireEvent } from '@testing-library/react'
import UserFontPreference from './UserFontPreference'
import { en } from '@/translations/en'

beforeEach(() => localStorage.clear())

test('three cards, Barlow by default, and the choice is kept', () => {
  render(<UserFontPreference />)
  expect(screen.getByRole('group', { name: en.homeLayout.fontLabel })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: new RegExp(en.homeLayout.fontBarlow) })).toBeChecked()
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(en.homeLayout.fontSofia) }))
  expect(screen.getByRole('radio', { name: new RegExp(en.homeLayout.fontSofia) })).toBeChecked()
  expect(localStorage.getItem('font-style')).toContain('sofia')
})

test('each card draws its own font, whichever is on', () => {
  const { container } = render(<UserFontPreference />)
  expect(container.querySelector('[data-font="barlow"]')).toBeInTheDocument()
  expect(container.querySelector('[data-font="sofia"]')).toBeInTheDocument()
  expect(container.querySelector('[data-font="fira"]')).toBeInTheDocument()
})
