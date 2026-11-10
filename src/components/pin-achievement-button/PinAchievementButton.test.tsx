import { render, screen, fireEvent } from '@testing-library/react'
import PinAchievementButton from './PinAchievementButton'
import { en } from '@/translations/en'

test('unpinned: offers to pin, reports itself as off, and toggles', () => {
  const onToggle = jest.fn()
  render(<PinAchievementButton pinned={false} title="Win a Match" onToggle={onToggle} />)
  const star = screen.getByRole('button', { name: `${en.favorites.addFavorite}: Win a Match` })
  expect(star.getAttribute('aria-pressed')).toBe('false')
  fireEvent.click(star)
  expect(onToggle).toHaveBeenCalled()
})

test('pinned: offers to unpin and reports itself as on', () => {
  render(<PinAchievementButton pinned title="Win a Match" onToggle={jest.fn()} />)
  const star = screen.getByRole('button', { name: `${en.favorites.removeFavorite}: Win a Match` })
  expect(star.getAttribute('aria-pressed')).toBe('true')
})
