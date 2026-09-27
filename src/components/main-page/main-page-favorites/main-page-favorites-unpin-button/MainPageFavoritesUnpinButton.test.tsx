import { render, screen, fireEvent } from '@testing-library/react'
import MainPageFavoritesUnpinButton from './MainPageFavoritesUnpinButton'
import { en } from '@/translations/en'

test('is a labelled button that unpins', () => {
  const onUnpin = jest.fn()
  render(<MainPageFavoritesUnpinButton onUnpin={onUnpin} />)
  fireEvent.click(screen.getByRole('button', { name: en.favorites.removeFavorite }))
  expect(onUnpin).toHaveBeenCalled()
})
