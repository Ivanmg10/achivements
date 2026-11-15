import { render, screen, fireEvent } from '@testing-library/react'
import UserGameCardPreference from './UserGameCardPreference'
import { en } from '@/translations/en'

beforeEach(() => localStorage.clear())

test('two cards, colourful by default, and the choice is kept', () => {
  render(<UserGameCardPreference />)
  expect(screen.getByRole('group', { name: en.homeLayout.cardsLabel })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: new RegExp(en.homeLayout.cardsTinted) })).toBeChecked()
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(en.homeLayout.cardsFlat) }))
  expect(screen.getByRole('radio', { name: new RegExp(en.homeLayout.cardsFlat) })).toBeChecked()
  expect(localStorage.getItem('game-card-style')).toContain('flat')
})
