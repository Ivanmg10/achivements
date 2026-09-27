import { render, screen, fireEvent } from '@testing-library/react'
import SteamPinnedGameRow from './SteamPinnedGameRow'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSortable } from '@dnd-kit/sortable'
import { en } from '@/translations/en'
import { toSteamGameProgress } from '@/utils/steamMappers'

jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: jest.fn(() => ({
    attributes: {}, listeners: {}, setNodeRef: jest.fn(), transform: null, transition: undefined, isDragging: false,
  })),
}))
jest.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => '' } } }))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({
  PinToggleButton: ({ gameId, source }: { gameId: number; source: string }) => (
    <span data-testid="pin">{source}:{gameId}</span>
  ),
}))
jest.mock('@/components/steam/steam-recently-played-expanded/SteamRecentlyPlayedExpanded', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="dashboard">{game.title}</div>,
}))

const PORTAL = {
  ...toSteamGameProgress({ appid: 620, name: 'Portal 2', playtime_forever: 60, has_community_visible_stats: true }),
  achievementsLoaded: true,
  maxPossible: 51,
  numAwarded: 20,
  pctWon: 39,
}

function setLibrary(overrides: Record<string, unknown> = {}) {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ library: [PORTAL], recent: [], libraryLoading: false, ...overrides })
}

beforeEach(() => {
  jest.clearAllMocks()
  setLibrary()
})

test('is sortable under a Steam key, apart from an RA game with the same id', () => {
  render(<SteamPinnedGameRow appId={620} isOpen={false} onToggle={jest.fn()} />)
  expect(useSortable).toHaveBeenCalledWith({ id: 'steam:620' })
})

test('shows the game from the library with its progress, and a Steam unpin', () => {
  render(<SteamPinnedGameRow appId={620} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.getByRole('link', { name: 'Portal 2' }).getAttribute('href')).toBe('/steamGame/620')
  expect(screen.getByRole('progressbar', { name: 'Portal 2' })).toBeInTheDocument()
  expect(screen.getByText(`20/51 ${en.statusGameItem.achievements}`)).toBeInTheDocument()
  expect(screen.getByTestId('pin')).toHaveTextContent('steam:620')
})

test('finds a game in the recent list when the library does not have it yet', () => {
  setLibrary({ library: [], recent: [PORTAL] })
  render(<SteamPinnedGameRow appId={620} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.getByText('Portal 2')).toBeInTheDocument()
})

test('shows a skeleton while the library loads', () => {
  setLibrary({ library: [], libraryLoading: true })
  const { container } = render(<SteamPinnedGameRow appId={620} isOpen={false} onToggle={jest.fn()} />)
  expect(container.querySelector('.animate-pulse')).not.toBeNull()
})

test('still renders a pin for a game no longer in the library', () => {
  setLibrary({ library: [] })
  render(<SteamPinnedGameRow appId={999} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.getByText('App 999')).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('has a labelled drag handle', () => {
  render(<SteamPinnedGameRow appId={620} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.getByRole('button', { name: en.cards.dragToReorder })).toBeInTheDocument()
})

test('expands into the same dashboard as the recent feed', () => {
  const onToggle = jest.fn()
  const { rerender } = render(<SteamPinnedGameRow appId={620} isOpen={false} onToggle={onToggle} />)
  const expand = screen.getByRole('button', { name: `${en.steam.showAchievements}: Portal 2` })
  expect(expand.getAttribute('aria-expanded')).toBe('false')
  fireEvent.click(expand)
  expect(onToggle).toHaveBeenCalledTimes(1)

  rerender(<SteamPinnedGameRow appId={620} isOpen onToggle={onToggle} />)
  expect(screen.getByTestId('dashboard')).toHaveTextContent('Portal 2')
  expect(screen.getByRole('button', { name: `${en.steam.hideAchievements}: Portal 2` })).toBeInTheDocument()
})

test('says so instead of loading achievements for a game without any', () => {
  setLibrary({ library: [{ ...PORTAL, hasStats: false }] })
  render(<SteamPinnedGameRow appId={620} isOpen onToggle={jest.fn()} />)
  expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
  expect(screen.getByText(en.steam.noAchievements)).toBeInTheDocument()
})
