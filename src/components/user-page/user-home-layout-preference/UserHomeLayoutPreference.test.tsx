import { render, screen, fireEvent } from '@testing-library/react'
import UserHomeLayoutPreference from './UserHomeLayoutPreference'
import { en } from '@/translations/en'

beforeEach(() => localStorage.clear())

test('two cards, classic by default, and the choice is kept', () => {
  render(<UserHomeLayoutPreference />)
  expect(screen.getByRole('group', { name: en.homeLayout.label })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: new RegExp(en.homeLayout.classic) })).toBeChecked()
  expect(screen.getByText(en.homeLayout.coverHint)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(en.homeLayout.cover) }))
  expect(screen.getByRole('radio', { name: new RegExp(en.homeLayout.cover) })).toBeChecked()
  expect(localStorage.getItem('home-layout')).toContain('cover')
})
