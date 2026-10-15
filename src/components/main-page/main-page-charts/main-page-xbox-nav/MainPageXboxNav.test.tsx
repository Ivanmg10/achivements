jest.mock('@/hooks/useXboxGamesByCategory', () => ({ useXboxGamesByCategory: jest.fn() }))

import { render, screen } from '@testing-library/react'
import MainPageXboxNav from './MainPageXboxNav'
import { useXboxGamesByCategory } from '@/hooks/useXboxGamesByCategory'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

test('each section with its count and first games, empty ones saying so', () => {
  ;(useXboxGamesByCategory as jest.Mock).mockImplementation((cat: string) => ({
    loading: false,
    games: cat === 'playing' ? [xboxGameFixture({ id: 1738914043, title: 'Halo' })] : [],
  }))
  render(<MainPageXboxNav />)
  expect(screen.getByRole('link', { name: new RegExp(en.categories.playing) })).toHaveAttribute('href', '/playing')
  expect(screen.getByRole('link', { name: 'Halo' })).toHaveAttribute('href', '/xboxGame/1738914043')
  expect(screen.getAllByText(en.xbox.noGamesInCategory)).toHaveLength(2)
  expect(screen.getByRole('link', { name: new RegExp(en.categories.wantToPlay) })).toHaveAttribute('href', '/wantToPlay')
})

test('a long section shows six and counts the rest', () => {
  const games = Array.from({ length: 9 }, (_, i) => xboxGameFixture({ id: i + 1, title: `G${i}` }))
  ;(useXboxGamesByCategory as jest.Mock).mockImplementation((cat: string) => ({ loading: false, games: cat === 'completed' ? games : [] }))
  render(<MainPageXboxNav />)
  expect(screen.getByRole('link', { name: '+3' })).toHaveAttribute('href', '/completed')
})

test('skeletons while loading', () => {
  ;(useXboxGamesByCategory as jest.Mock).mockReturnValue({ loading: true, games: [] })
  const { container } = render(<MainPageXboxNav />)
  expect(container.querySelectorAll('[aria-busy="true"]')).toHaveLength(3)
})
