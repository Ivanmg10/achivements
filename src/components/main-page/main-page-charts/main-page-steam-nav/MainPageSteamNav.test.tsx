jest.mock('@/hooks/useSteamGamesByCategory', () => ({ useSteamGamesByCategory: jest.fn() }))

import { render, screen } from '@testing-library/react'
import MainPageSteamNav from './MainPageSteamNav'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import { en } from '@/translations/en'

function game(id: number, imageIcon = `https://cdn/${id}.jpg`) {
  return { id, title: `Game ${id}`, imageIcon }
}

function categories(byCat: Record<string, ReturnType<typeof game>[]>, loading = false) {
  ;(useSteamGamesByCategory as jest.Mock).mockImplementation((cat: string) => ({ games: byCat[cat] ?? [], loading }))
}

test('shows each section’s Steam game count, linking to its page', () => {
  categories({ playing: [game(1), game(2)], completed: [game(3)] })
  render(<MainPageSteamNav />)
  const playing = screen.getByRole('link', { name: new RegExp(en.categories.playing) })
  expect(playing.getAttribute('href')).toBe('/playing')
  expect(playing.textContent).toContain('2')
  expect(screen.getByRole('link', { name: 'Game 3' }).getAttribute('href')).toBe('/steamGame/3')
  expect(screen.getByText(en.steam.noGamesInCategory)).toBeInTheDocument()
})

test('previews six games and links the rest to the section', () => {
  categories({ playing: Array.from({ length: 8 }, (_, i) => game(i + 1)) })
  render(<MainPageSteamNav />)
  expect(screen.queryByRole('link', { name: 'Game 7' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: '+2' }).getAttribute('href')).toBe('/playing')
})

test('keeps a game without an icon reachable by name', () => {
  categories({ playing: [game(1, '')] })
  render(<MainPageSteamNav />)
  expect(screen.getByRole('link', { name: 'Game 1' })).toBeInTheDocument()
})

test('shows placeholders while the library loads', () => {
  categories({}, true)
  const { container } = render(<MainPageSteamNav />)
  expect(container.querySelectorAll('[aria-busy="true"]')).toHaveLength(3)
})
