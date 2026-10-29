import { fireEvent, render, screen } from '@testing-library/react'
import MainPagePortada from './MainPagePortada'
import { useRecentFeed } from '@/hooks/useRecentFeed'
import { useGameInsights } from '@/hooks/useGameInsights'
import { en } from '@/translations/en'

jest.mock('@/hooks/useRecentFeed', () => ({ useRecentFeed: jest.fn() }))
jest.mock('@/hooks/useGameInsights', () => ({ useGameInsights: jest.fn() }))

const steamItem = {
  source: 'steam', key: 's', lastPlayed: null,
  game: { _source: 'steam', id: 620, title: 'Portal 2', consoleName: 'PC', imageIcon: '', maxPossible: 51, numAwarded: 40, pctWon: 78, lastPlayed: null },
}
const target = (title: string, rarity: number) => ({
  id: title, title, description: '', earned: false, earnedAt: null, rarity, points: null, kind: null, iconUrl: null, href: '#',
})

beforeEach(() => (useGameInsights as jest.Mock).mockReturnValue({ items: [], loading: false, error: false }))

test('shows the game played last, its console, its progress and the ways in', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  render(<MainPagePortada />)
  expect(screen.getByRole('heading', { name: 'Portal 2' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Portal 2' }).closest('section')).toHaveClass('home-cover')
  expect(screen.getByText('PC')).toBeInTheDocument()
  expect(screen.getByText('40 / 51')).toBeInTheDocument()
  expect(screen.getByText(en.homeLayout.continueKicker)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.homeLayout.openGame })).toHaveAttribute('href', '/steamGame/620')
  expect(screen.getByRole('link', { name: 'See the 11 left' })).toHaveAttribute('href', '/steamGame/620')
})

test('names the easiest achievement left, with how many players have it', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [target('Hard one', 2.5), target('Easy one', 43.9)], loading: false, error: false })
  render(<MainPagePortada />)
  expect(useGameInsights).toHaveBeenCalledWith('steam', 620)
  expect(screen.getByText('Easy one')).toBeInTheDocument()
  expect(screen.getByText(/43\.9 % of players have it/)).toBeInTheDocument()
})

const artOf = (container: HTMLElement) => container.querySelector('section img')?.getAttribute('src') ?? ''

test('the art that fails to load gives way to the next, and the last to the game picture as a poster', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  const { container } = render(<MainPagePortada />)
  expect(artOf(container)).toContain('library_hero')
  fireEvent.error(container.querySelector('section img')!)
  expect(artOf(container)).toContain('header.jpg')
  fireEvent.error(container.querySelector('section img')!)
  // Nothing wide left: the poster is the game's cover, never an empty box.
  expect(artOf(container)).toContain('library_600x900')
})

test('a wide picture the game page reads (RA, Xbox) comes first', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  ;(useGameInsights as jest.Mock).mockReturnValue({ items: [], art: 'https://wide/art.png', loading: false, error: false })
  const { container } = render(<MainPagePortada />)
  expect(artOf(container)).toBe('https://wide/art.png')
})

test('draws nothing while loading or without a game', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: true })
  const { container, rerender } = render(<MainPagePortada />)
  expect(container).toBeEmptyDOMElement()
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [], loading: false })
  rerender(<MainPagePortada />)
  expect(container).toBeEmptyDOMElement()
})
