import { render, screen } from '@testing-library/react'
import AuthBrand from './AuthBrand'

test('names the app and says what it is for', () => {
  render(<AuthBrand />)
  expect(screen.getByText('CheevoVault')).toBeInTheDocument()
  expect(screen.getByText('Every achievement you have earned, in one place')).toBeInTheDocument()
})

test('lists the platforms, PlayStation marked as coming in words', () => {
  render(<AuthBrand />)
  const items = screen.getAllByRole('listitem').map((li) => li.textContent)
  expect(items).toEqual(['RetroAchievements', 'Steam', 'PlayStation · coming soon'])
})
