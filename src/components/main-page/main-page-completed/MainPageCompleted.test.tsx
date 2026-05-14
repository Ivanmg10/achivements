jest.mock('@/hooks/useGamesCompletedPreview', () => ({
  useGamesCompletedPreview: jest.fn(),
}))

jest.mock('@/hooks/useResizableList', () => ({
  useResizableList: () => 5,
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

import { render, screen, fireEvent } from '@testing-library/react'
import MainPageCompleted from './MainPageCompleted'
import { useGamesCompletedPreview } from '@/hooks/useGamesCompletedPreview'

const softcoreGame = { GameID: 1, GameTitle: 'Sly Cooper', ConsoleID: 21, ConsoleName: 'PS2', ImageIcon: '/icon.png', PctWon: '1.0', NumAchievedHardcore: 0, NumAchievements: 10 }
const hardcoreGame = { GameID: 2, GameTitle: 'Jak 2', ConsoleID: 21, ConsoleName: 'PS2', ImageIcon: '/icon2.png', PctWon: '1.0', NumAchievedHardcore: 10, NumAchievements: 10 }

beforeEach(() => {
  ;(useGamesCompletedPreview as jest.Mock).mockReturnValue({
    listGames: [softcoreGame],
    listGamesHardcore: [hardcoreGame],
    isLoading: false,
  })
})

test('renders completed section header', () => {
  render(<MainPageCompleted />)
  expect(screen.getByText('Completed')).toBeInTheDocument()
})

test('renders softcore games on default tab', () => {
  render(<MainPageCompleted />)
  expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
})

test('shows empty message when no games', () => {
  ;(useGamesCompletedPreview as jest.Mock).mockReturnValue({
    listGames: [],
    listGamesHardcore: [],
    isLoading: false,
  })
  render(<MainPageCompleted />)
  expect(screen.getByText(/No normal completions yet/i)).toBeInTheDocument()
})

test('switches to hardcore tab', () => {
  render(<MainPageCompleted />)
  fireEvent.click(screen.getByText('Hardcore'))
  expect(screen.getByText('Jak 2')).toBeInTheDocument()
})
