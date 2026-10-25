import { render, screen, fireEvent } from '@testing-library/react'
import UserShapePreference from './UserShapePreference'
import { en } from '@/translations/en'

beforeEach(() => localStorage.clear())

test('two cards, slanted by default, and the choice is kept', () => {
  render(<UserShapePreference />)
  expect(screen.getByRole('group', { name: en.homeLayout.shapeLabel })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: new RegExp(en.homeLayout.shapeSlanted) })).toBeChecked()
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(en.homeLayout.shapeRound) }))
  expect(screen.getByRole('radio', { name: new RegExp(en.homeLayout.shapeRound) })).toBeChecked()
  expect(localStorage.getItem('shape-style')).toContain('round')
})

test('each card draws its own design, whichever is on', () => {
  const { container } = render(<UserShapePreference />)
  expect(container.querySelector('[data-shape="slanted"]')).toBeInTheDocument()
  expect(container.querySelector('[data-shape="round"]')).toBeInTheDocument()
})
