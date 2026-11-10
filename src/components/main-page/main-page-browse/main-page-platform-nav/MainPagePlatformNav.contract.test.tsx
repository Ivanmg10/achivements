jest.mock('@/hooks/useSteamGamesByCategory', () => ({ useSteamGamesByCategory: jest.fn() }))
jest.mock('@/hooks/usePsnGamesByCategory', () => ({ usePsnGamesByCategory: jest.fn() }))
jest.mock('@/hooks/useXboxGamesByCategory', () => ({ useXboxGamesByCategory: jest.fn() }))
jest.mock('@/components/steam/steam-game-image/SteamGameImage', () => ({
  __esModule: true,
  default: ({ appId }: { appId: number }) => <span data-testid="steam-icon">{appId}</span>,
}))

import { render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import MainPageSteamNav from '../main-page-steam-nav/MainPageSteamNav'
import MainPagePsnNav from '../main-page-psn-nav/MainPagePsnNav'
import MainPageXboxNav from '../main-page-xbox-nav/MainPageXboxNav'
import { useSteamGamesByCategory } from '@/hooks/useSteamGamesByCategory'
import { usePsnGamesByCategory } from '@/hooks/usePsnGamesByCategory'
import { useXboxGamesByCategory } from '@/hooks/useXboxGamesByCategory'
import { en } from '@/translations/en'

type Platform = {
  name: string
  Nav: ComponentType
  hook: jest.Mock
  /** A game's id and the address its icon links to. */
  id: number
  href: string
  empty: string
}

const PLATFORMS: Platform[] = [
  { name: 'Steam', Nav: MainPageSteamNav, hook: useSteamGamesByCategory as jest.Mock, id: 620, href: '/steamGame/620', empty: en.steam.noGamesInCategory },
  { name: 'PlayStation', Nav: MainPagePsnNav, hook: usePsnGamesByCategory as jest.Mock, id: 2018800, href: '/psnGame/NPWR20188_00', empty: en.psn.noGamesInCategory },
  { name: 'Xbox', Nav: MainPageXboxNav, hook: useXboxGamesByCategory as jest.Mock, id: 1738914043, href: '/xboxGame/1738914043', empty: en.xbox.noGamesInCategory },
]

const game = (id: number, title = `Game ${id}`) => ({ id, title, imageIcon: '' })
const categories = (p: Platform, byCategory: Record<string, ReturnType<typeof game>[]>, loading = false) =>
  p.hook.mockImplementation((cat: string) => ({ games: byCategory[cat] ?? [], loading }))

describe.each(PLATFORMS)('the home navigation card: $name', (p) => {
  test('each list shows how many games it holds, links to its page, and says when it has none', () => {
    categories(p, { playing: [game(p.id, 'Alpha'), game(p.id + 1, 'Beta')], completed: [game(p.id + 2)] })
    render(<p.Nav />)
    const playing = screen.getByRole('link', { name: new RegExp(en.categories.playing) })
    expect(playing).toHaveAttribute('href', '/playing')
    expect(playing).toHaveTextContent('2')
    expect(screen.getByRole('link', { name: new RegExp(en.categories.completed) })).toHaveTextContent('1')
    expect(screen.getByRole('link', { name: new RegExp(en.categories.wantToPlay) })).toHaveAttribute('href', '/wantToPlay')
    expect(screen.getByText(p.empty)).toBeInTheDocument()
  })

  test('a game is reachable by name, with or without an icon', () => {
    categories(p, { playing: [game(p.id, 'Alpha')] })
    render(<p.Nav />)
    expect(screen.getByRole('link', { name: 'Alpha' })).toHaveAttribute('href', p.href)
  })

  test('a long list shows six games and counts the rest, linking to the list', () => {
    categories(p, { completed: Array.from({ length: 9 }, (_, i) => game(p.id + i, `G${i}`)) })
    render(<p.Nav />)
    expect(screen.getAllByRole('link', { name: /^G\d$/ })).toHaveLength(6)
    expect(screen.getByRole('link', { name: '+3' })).toHaveAttribute('href', '/completed')
  })

  test('holds the three lists as placeholders while the library loads', () => {
    categories(p, {}, true)
    const { container } = render(<p.Nav />)
    expect(container.querySelectorAll('[aria-busy="true"]')).toHaveLength(3)
    expect(screen.queryByText(p.empty)).not.toBeInTheDocument()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })
})
