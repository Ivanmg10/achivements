jest.mock('@/components/main-page/main-page-profile/MainPageProfile', () => ({
  __esModule: true,
  default: () => <div data-testid="profile">Profile</div>,
}))

jest.mock('@/components/main-page/main-page-want-to-play/MainPageWantToPlay', () => ({
  __esModule: true,
  default: () => <div data-testid="want-to-play">WantToPlay</div>,
}))

jest.mock('@/components/main-page/main-page-games/MainPageGames', () => ({
  __esModule: true,
  default: () => <div data-testid="games">Games</div>,
}))

jest.mock('@/components/main-page/main-page-completed/MainPageCompleted', () => ({
  __esModule: true,
  default: () => <div data-testid="completed">Completed</div>,
}))

jest.mock('@/components/main-page/main-page-no-ra/MainPageNoRa', () => ({
  __esModule: true,
  default: () => <div data-testid="no-ra">NoRa</div>,
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
  useMainView: () => ({ view: 'panels' }),
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
