import { render, screen, fireEvent } from '@testing-library/react'
import SteamRecentList from './SteamRecentList'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { en } from '@/translations/en'

jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('../steam-game-item/SteamGameItem', () => ({
  __esModule: true,
  default: ({ game, expanded, onToggle }: { game: { title: string }; expanded: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} aria-expanded={expanded}>
      {game.title}
    </button>
  ),
}))

const refetch = jest.fn()

function setContext(overrides: Record<string, unknown> = {}) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({
    recent: [
      { id: 1, title: 'Portal 2' },
      { id: 2, title: 'Hades' },
    ],
    recentLoading: false,
    recentError: null,
    refetch,
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  setContext()
})

test('lists recent Steam games under a heading', () => {
  render(<SteamRecentList />)
  expect(screen.getByRole('heading', { name: en.cards.recentlyPlayed })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Portal 2' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Hades' })).toBeInTheDocument()
})

test('caps the list at seven games', () => {
  setContext({ recent: Array.from({ length: 12 }, (_, i) => ({ id: i, title: `G${i}` })) })
  render(<SteamRecentList />)
  expect(screen.getAllByRole('button')).toHaveLength(7)
})

test('keeps one game expanded at a time', () => {
  render(<SteamRecentList />)
  const portal = screen.getByRole('button', { name: 'Portal 2' })
  const hades = screen.getByRole('button', { name: 'Hades' })

  fireEvent.click(portal)
  expect(portal.getAttribute('aria-expanded')).toBe('true')

  fireEvent.click(hades)
  expect(portal.getAttribute('aria-expanded')).toBe('false')
  expect(hades.getAttribute('aria-expanded')).toBe('true')

  fireEvent.click(hades)
  expect(hades.getAttribute('aria-expanded')).toBe('false')
})

test('shows a busy skeleton while loading', () => {
  setContext({ recentLoading: true, recent: [] })
  const { container } = render(<SteamRecentList />)
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
})

test('announces an error with a retry', () => {
  setContext({ recentError: 'boom', recent: [] })
  render(<SteamRecentList />)

  expect(screen.getByRole('alert')).toHaveTextContent(en.steam.gamesError)
  fireEvent.click(screen.getByRole('button', { name: en.steam.retry }))
  expect(refetch).toHaveBeenCalledTimes(1)
})

test('shows an empty state with nothing recent', () => {
  setContext({ recent: [] })
  render(<SteamRecentList />)
  expect(screen.getByText(en.steam.recentEmpty)).toBeInTheDocument()
})
