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
jest.mock('@/context/MainPlatformContext', () => ({ useMainPlatform: jest.fn() }))
jest.mock('@/components/main-page/main-page-charts/MainPageConsoleNav', () => ({ __esModule: true, default: () => <div data-testid="nav" /> }))
jest.mock('@/components/main-page/main-page-charts/main-page-steam-nav/MainPageSteamNav', () => ({
  __esModule: true,
  default: () => <div data-testid="steam-nav" />,
}))
jest.mock('./browse-picker/BrowsePicker', () => ({ __esModule: true, default: () => <div data-testid="picker" /> }))
jest.mock('./browse-search/BrowseSearch', () => ({ __esModule: true, default: () => <div data-testid="search" /> }))
jest.mock('./browse-split/BrowseSplit', () => ({ __esModule: true, default: () => <div data-testid="split" /> }))
jest.mock('./browse-consoles/BrowseConsoles', () => ({ __esModule: true, default: () => <div data-testid="consoles" /> }))

test('RA mode: console nav and console tiles, with the picker, search and comparison', () => {
  ;(useMainPlatform as jest.Mock).mockReturnValue({ platform: 'ra' })
  render(<MainPageBrowse />)
  for (const id of ['nav', 'picker', 'search', 'split', 'consoles']) expect(screen.getByTestId(id)).toBeInTheDocument()
  expect(screen.queryByTestId('steam-nav')).not.toBeInTheDocument()
})

test('Steam mode: its own nav, and no console tiles (Steam has no consoles)', () => {
  ;(useMainPlatform as jest.Mock).mockReturnValue({ platform: 'steam' })
  render(<MainPageBrowse />)
  expect(screen.getByTestId('steam-nav')).toBeInTheDocument()
  expect(screen.queryByTestId('consoles')).not.toBeInTheDocument()
  expect(screen.getByTestId('picker')).toBeInTheDocument()
})
