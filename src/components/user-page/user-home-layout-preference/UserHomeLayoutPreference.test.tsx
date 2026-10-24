import { render, screen, fireEvent } from '@testing-library/react'
import UserHomeLayoutPreference from './UserHomeLayoutPreference'
import { en } from '@/translations/en'

beforeEach(() => localStorage.clear())

test('classic by default, and the choice is kept', () => {
  render(<UserHomeLayoutPreference />)
  expect(screen.getByRole('button', { name: en.homeLayout.classic })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: en.homeLayout.cover }))
  expect(screen.getByRole('button', { name: en.homeLayout.cover })).toHaveAttribute('aria-pressed', 'true')
  expect(localStorage.getItem('home-layout')).toContain('cover')
})
