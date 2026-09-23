import { render, screen, fireEvent } from '@testing-library/react'
import SteamPinAchievementButton from './SteamPinAchievementButton'
import { en } from '@/translations/en'

test('unpinned: offers to pin, reports itself as off, and toggles', () => {
  const onToggle = jest.fn()
  render(<SteamPinAchievementButton pinned={false} title="Win a Match" onToggle={onToggle} />)
  const star = screen.getByRole('switch', { name: `${en.favorites.addFavorite}: Win a Match` })
  expect(star.getAttribute('aria-checked')).toBe('false')
  fireEvent.click(star)
  expect(onToggle).toHaveBeenCalled()
})

test('pinned: offers to unpin and reports itself as on', () => {
  render(<SteamPinAchievementButton pinned title="Win a Match" onToggle={jest.fn()} />)
  const star = screen.getByRole('switch', { name: `${en.favorites.removeFavorite}: Win a Match` })
  expect(star.getAttribute('aria-checked')).toBe('true')
})
