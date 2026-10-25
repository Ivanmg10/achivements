import { render, screen } from '@testing-library/react'
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

test('draws nothing while loading or without a game', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: true })
  const { container, rerender } = render(<MainPagePortada />)
  expect(container).toBeEmptyDOMElement()
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [], loading: false })
  rerender(<MainPagePortada />)
  expect(container).toBeEmptyDOMElement()
})
