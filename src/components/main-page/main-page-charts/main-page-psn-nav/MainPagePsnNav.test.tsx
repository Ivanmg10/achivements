jest.mock('@/hooks/usePsnGamesByCategory', () => ({ usePsnGamesByCategory: jest.fn() }))

import { render, screen } from '@testing-library/react'
import MainPagePsnNav from './MainPagePsnNav'
import { usePsnGamesByCategory } from '@/hooks/usePsnGamesByCategory'
import { en } from '@/translations/en'

test('each section with its count and first games, "no achievements" included', () => {
  ;(usePsnGamesByCategory as jest.Mock).mockImplementation((cat: string) => ({
    loading: false,
    games: cat === 'playing' ? [{ id: 2018800, title: 'Astro Bot', imageIcon: '' }] : [],
  }))
  render(<MainPagePsnNav />)
  expect(screen.getByRole('link', { name: new RegExp(en.categories.playing) })).toHaveAttribute('href', '/playing')
  expect(screen.getByRole('link', { name: 'Astro Bot' })).toHaveAttribute('href', '/psnGame/NPWR20188_00')
  expect(screen.getAllByText(en.psn.noGamesInCategory)).toHaveLength(2)
  expect(screen.getByRole('link', { name: new RegExp(en.categories.wantToPlay) })).toHaveAttribute('href', '/wantToPlay')
})
