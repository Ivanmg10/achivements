import { render, screen } from '@testing-library/react'
import MainPageBrowse from './MainPageBrowse'
import { useMainPlatform } from '@/context/MainPlatformContext'

jest.mock('@/hooks/useAllGamesGlobal', () => ({
  useAllGamesGlobal: () => ({ wantToPlay: [], playing: [], completed: [], loading: false, error: false, refetch: jest.fn() }),
}))
jest.mock('@/context/GamesDataContext', () => ({
  useGamesData: () => ({
    all: [{ GameID: 1, Title: 'Zelda', ImageIcon: '', ConsoleID: 3, ConsoleName: 'SNES', MaxPossible: 10, NumAwarded: 10, PctWon: '1.0', HardcoreMode: '1' }],
  }),
}))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: () => ({ library: [] }) }))
const mockPsnData = jest.fn(() => ({ library: [] as unknown[], libraryLoading: false }))
jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: () => mockPsnData() }))
jest.mock('@/context/MainPlatformContext', () => ({ useMainPlatform: jest.fn() }))
jest.mock('./main-page-console-nav/MainPageConsoleNav', () => ({ __esModule: true, default: () => <div data-testid="nav" /> }))
jest.mock('./main-page-steam-nav/MainPageSteamNav', () => ({
  __esModule: true,
  default: () => <div data-testid="steam-nav" />,
}))
jest.mock('./browse-search/BrowseSearch', () => ({ __esModule: true, default: () => <div data-testid="search" /> }))
jest.mock('./browse-consoles/BrowseConsoles', () => ({ __esModule: true, default: () => <div data-testid="consoles" /> }))

test('RA mode: console nav, the search and console tiles', () => {
  ;(useMainPlatform as jest.Mock).mockReturnValue({ platform: 'ra' })
  render(<MainPageBrowse />)
  for (const id of ['nav', 'search', 'consoles']) expect(screen.getByTestId(id)).toBeInTheDocument()
  expect(screen.queryByTestId('steam-nav')).not.toBeInTheDocument()
})

test('Steam mode: its own nav, and the console tiles of every platform still there (#164)', () => {
  ;(useMainPlatform as jest.Mock).mockReturnValue({ platform: 'steam' })
  render(<MainPageBrowse />)
  expect(screen.getByTestId('steam-nav')).toBeInTheDocument()
  expect(screen.getByTestId('consoles')).toBeInTheDocument()
  expect(screen.getByTestId('search')).toBeInTheDocument()
})

test('the consoles wait for every library, under one skeleton', () => {
  ;(useMainPlatform as jest.Mock).mockReturnValue({ platform: 'ra' })
  mockPsnData.mockReturnValueOnce({ library: [], libraryLoading: true })
  const { container } = render(<MainPageBrowse />)
  expect(screen.queryByTestId('consoles')).not.toBeInTheDocument()
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
})
