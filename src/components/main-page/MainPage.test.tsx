jest.mock('@/components/main-page/main-page-profile/MainPageProfile', () => ({
  __esModule: true,
  default: () => <div data-testid="profile">Profile</div>,
}))

jest.mock('@/components/main-page/main-page-pinned-games/MainPagePinnedGames', () => ({
  __esModule: true,
  default: () => <div data-testid="pinned-games">PinnedGames</div>,
}))

jest.mock('@/components/main-page/main-page-no-ra/MainPageNoRa', () => ({
  __esModule: true,
  default: () => <div data-testid="no-ra">NoRa</div>,
}))

jest.mock('@/components/main-page/main-page-steam-only/MainPageSteamOnly', () => ({
  __esModule: true,
  default: () => <div data-testid="steam-only">SteamOnly</div>,
}))

jest.mock('@/components/loading-page/LoadingPage', () => ({
  __esModule: true,
  default: () => <div data-testid="loading">Loading</div>,
}))

jest.mock('@/components/main-page/main-page-charts/MainPageCharts', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/ra-recently-played/RARecentlyPlayed', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/main-page/main-page-progression/MainPageProgression', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/context/MainViewContext', () => ({
  useMainView: () => ({ view: 'pinned' }),
  MainViewProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { render, screen } from '@testing-library/react'
import MainPage from './MainPage'
import { useSession } from 'next-auth/react'

test('renders profile when authenticated with raUser', () => {
  ;(useSession as jest.Mock).mockReturnValue({
    status: 'authenticated',
    data: { user: { raUser: { User: 'Ivan' } } },
  })
  render(<MainPage />)
  expect(screen.getByTestId('profile')).toBeInTheDocument()
})

test('renders the pinned games section when view is "pinned"', () => {
  ;(useSession as jest.Mock).mockReturnValue({
    status: 'authenticated',
    data: { user: { raUser: { User: 'Ivan' } } },
  })
  render(<MainPage />)
  expect(screen.getByTestId('pinned-games')).toBeInTheDocument()
})

test('renders loading page when status is loading', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'loading', data: null })
  render(<MainPage />)
  expect(screen.getByTestId('loading')).toBeInTheDocument()
})

test('renders NoRa page when authenticated but no raUser', () => {
  ;(useSession as jest.Mock).mockReturnValue({
    status: 'authenticated',
    data: { user: {} },
  })
  render(<MainPage />)
  expect(screen.getByTestId('no-ra')).toBeInTheDocument()
})

test('renders the Steam-only page when Steam is linked but RA is not', () => {
  ;(useSession as jest.Mock).mockReturnValue({
    status: 'authenticated',
    data: { user: { steamid: '76561198000000000' } },
  })
  render(<MainPage />)
  expect(screen.getByTestId('steam-only')).toBeInTheDocument()
  expect(screen.queryByTestId('no-ra')).not.toBeInTheDocument()
})

test('keeps the full RA page when both accounts are linked', () => {
  ;(useSession as jest.Mock).mockReturnValue({
    status: 'authenticated',
    data: { user: { raUser: { User: 'Ivan' }, steamid: '76561198000000000' } },
  })
  render(<MainPage />)
  expect(screen.getByTestId('profile')).toBeInTheDocument()
  expect(screen.queryByTestId('steam-only')).not.toBeInTheDocument()
})
