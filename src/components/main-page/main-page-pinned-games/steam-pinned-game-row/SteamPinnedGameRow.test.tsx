import { render, screen } from '@testing-library/react'
import SteamPinnedGameRow from './SteamPinnedGameRow'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
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

// What every platform's row does is in PinnedGameCard.contract.test.tsx; this is Steam's own.
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

test('finds a game in the recent list when the library does not have it yet', () => {
  setLibrary({ library: [], recent: [PORTAL] })
  render(<SteamPinnedGameRow appId={620} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.getByText('Portal 2')).toBeInTheDocument()
})

test('still renders a pin for a game no longer in the library, with no bar', () => {
  setLibrary({ library: [] })
  render(<SteamPinnedGameRow appId={999} isOpen={false} onToggle={jest.fn()} />)
  expect(screen.getByText('App 999')).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('says so instead of loading achievements for a game without any', () => {
  setLibrary({ library: [{ ...PORTAL, hasStats: false }] })
  render(<SteamPinnedGameRow appId={620} isOpen onToggle={jest.fn()} />)
  expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
  expect(screen.getByText(en.steam.noAchievements)).toBeInTheDocument()
})

test('a Steam unpin, and the same dashboard as the recent feed when open', () => {
  render(<SteamPinnedGameRow appId={620} isOpen onToggle={jest.fn()} />)
  expect(screen.getByTestId('pin')).toHaveTextContent('steam:620')
  expect(screen.getByTestId('dashboard')).toHaveTextContent('Portal 2')
})
