jest.mock('@/hooks/useGamesInProgressPreview', () => ({
  useGamesInProgressPreview: jest.fn(),
}))

jest.mock('@/hooks/useRecentlyPlayedGames', () => ({
  useRecentlyPlayedGames: () => [],
}))

jest.mock('@/hooks/useResizableList', () => ({
  useResizableList: () => 5,
}))

jest.mock('@/contexts/MainViewContext', () => ({
  useMainView: () => ({ view: 'all' }),
}))

jest.mock('@/components/main-page/main-page-games/main-page-games-list/MainPageGamesList', () => ({
  __esModule: true,
  default: ({ listGames }: { listGames: { GameTitle: string }[] }) => (
    <div>{(listGames ?? []).map((g) => <span key={g.GameTitle}>{g.GameTitle}</span>)}</div>
  ),
}))

jest.mock('@/components/main-page/console-side-list/ConsoleSideList', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/ui/GameCardSkeleton', () => ({
  GameCardSkeleton: () => <div data-testid="skeleton" />,
}))

jest.mock('@/components/empty-state/EmptyState', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div>{title}</div>,
}))

import { render, screen } from '@testing-library/react'
import MainPageGames from './MainPageGames'
import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'

const mockGame = {
  GameID: 1234,
  GameTitle: 'Crash Bandicoot',
  ConsoleID: 12,
  ConsoleName: 'PlayStation',
  ImageIcon: '/icon.png',
  NumAchievements: 40,
  NumAchievedHardcore: 18,
  PctWon: '0.45',
}

beforeEach(() => {
  ;(useGamesInProgressPreview as jest.Mock).mockReturnValue({
    listGames: [mockGame],
    isLoading: false,
  })
})

test('renders section title', () => {
  render(<MainPageGames />)
  expect(screen.getByText('Playing')).toBeInTheDocument()
})

test('renders in-progress games', () => {
  render(<MainPageGames />)
  expect(screen.getByText('Crash Bandicoot')).toBeInTheDocument()
})

test('shows empty message when no in-progress games', () => {
  ;(useGamesInProgressPreview as jest.Mock).mockReturnValue({ listGames: [], isLoading: false })
  render(<MainPageGames />)
  expect(screen.getByText('Nothing playing right now')).toBeInTheDocument()
})

test('shows skeletons when loading', () => {
  ;(useGamesInProgressPreview as jest.Mock).mockReturnValue({ listGames: [], isLoading: true })
  render(<MainPageGames />)
  expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
})
