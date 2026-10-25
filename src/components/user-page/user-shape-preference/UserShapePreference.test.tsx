import { render, screen, fireEvent } from '@testing-library/react'
import UserShapePreference from './UserShapePreference'
import { en } from '@/translations/en'

beforeEach(() => localStorage.clear())

test('slanted by default, and the choice is kept', () => {
  render(<UserShapePreference />)
  expect(screen.getByRole('button', { name: en.homeLayout.shapeSlanted })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: en.homeLayout.shapeRound }))
  expect(screen.getByRole('button', { name: en.homeLayout.shapeRound })).toHaveAttribute('aria-pressed', 'true')
  expect(localStorage.getItem('shape-style')).toContain('round')
})
