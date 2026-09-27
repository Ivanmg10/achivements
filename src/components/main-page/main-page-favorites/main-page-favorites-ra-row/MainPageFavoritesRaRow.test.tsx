import { render, screen, fireEvent } from '@testing-library/react'
import MainPageFavoritesRaRow from './MainPageFavoritesRaRow'
import { en } from '@/translations/en'

const FAV = {
  source: 'ra' as const, achievement_id: 5, game_id: 1, game_title: 'Zelda', num_distinct_players: 3,
  snapshot: { Title: 'Triforce', BadgeName: '123', Points: 25, DateEarned: '2024-01-01' },
} as never

test('shows the achievement, its points and a link to its game', () => {
  render(<MainPageFavoritesRaRow fav={FAV} onOpen={jest.fn()} onUnpin={jest.fn()} />)
  expect(screen.getByText('Triforce')).toBeInTheDocument()
  expect(screen.getByText('25')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Zelda' }).getAttribute('href')).toBe('/gameInfo/1')
})

test('opens on click, but not when following the game link', () => {
  const onOpen = jest.fn()
  render(<MainPageFavoritesRaRow fav={FAV} onOpen={onOpen} onUnpin={jest.fn()} />)
  fireEvent.click(screen.getByRole('link', { name: 'Zelda' }))
  expect(onOpen).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Triforce'))
  expect(onOpen).toHaveBeenCalled()
})

test('the star unpins it', () => {
  const onUnpin = jest.fn()
  render(<MainPageFavoritesRaRow fav={FAV} onOpen={jest.fn()} onUnpin={onUnpin} />)
  fireEvent.click(screen.getByRole('button', { name: en.favorites.removeFavorite }))
  expect(onUnpin).toHaveBeenCalled()
})
