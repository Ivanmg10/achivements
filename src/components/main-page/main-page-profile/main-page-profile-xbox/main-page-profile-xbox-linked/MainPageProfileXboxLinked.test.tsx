jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))
jest.mock('@/hooks/useXboxRecentAchievements', () => ({
  useXboxRecentAchievements: jest.fn(() => ({ achievements: [], isLoading: false, error: null, retry: jest.fn() })),
}))
jest.mock('../main-page-profile-xbox-game/MainPageProfileXboxGame', () => ({
  __esModule: true,
  default: ({ game }: { game: { title: string } }) => <div data-testid="game">{game.title}</div>,
}))
jest.mock('../main-page-profile-xbox-achievements/MainPageProfileXboxAchievements', () => ({
  __esModule: true,
  default: ({ achievements }: { achievements: { gameId: number }[] }) => <div data-testid="achievements">{achievements.map((a) => a.gameId).join(',')}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import MainPageProfileXboxLinked from './MainPageProfileXboxLinked'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxRecentAchievements } from '@/hooks/useXboxRecentAchievements'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import type { XboxSummary } from '@/types/xbox'

const SUMMARY: XboxSummary = {
  gamertag: 'PalmeraMiami', avatarUrl: 'https://a.png', bio: 'Hello', tier: 'Silver', gamerscore: 10242, achievementsUnlocked: 593, games: 135,
}

beforeEach(() => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ library: [xboxGameFixture({ title: 'Halo' })], libraryLoading: false })
})

test('the profile: name, tier, bio, link out, stats, last game, latest achievements', () => {
  render(<MainPageProfileXboxLinked summary={SUMMARY} isLoading={false} error={null} onRetry={jest.fn()} />)
  expect(screen.getByText('PalmeraMiami')).toBeInTheDocument()
  expect(screen.getAllByText('Silver').length).toBeGreaterThan(0)
  expect(screen.getByText('Hello')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.xbox.viewOnXbox })).toHaveAttribute('href', 'https://www.xbox.com/play/user/PalmeraMiami')
  expect(screen.getByText('10,242')).toBeInTheDocument()
  expect(screen.getByTestId('game')).toHaveTextContent('Halo')
  expect(screen.getByTestId('achievements')).toBeInTheDocument()
  expect(useXboxRecentAchievements).toHaveBeenCalledWith('recent')
})

test('without an avatar, the Xbox mark stands in', () => {
  const { container } = render(<MainPageProfileXboxLinked summary={{ ...SUMMARY, avatarUrl: null }} isLoading={false} error={null} onRetry={jest.fn()} />)
  expect(container.querySelector('[data-testid="xbox-logo"]')).toBeInTheDocument()
})

test('the last game is the last one played that has achievements, not one that is just owned', () => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({
    library: [
      xboxGameFixture({ id: 1, title: 'Just owned', totalGamerscore: 0, maxPossible: 0 }),
      xboxGameFixture({ id: 2, title: 'Halo' }),
    ],
    libraryLoading: false,
  })
  render(<MainPageProfileXboxLinked summary={SUMMARY} isLoading={false} error={null} onRetry={jest.fn()} />)
  expect(screen.getByTestId('game')).toHaveTextContent('Halo')
})

test('a failure says why and retries', () => {
  const onRetry = jest.fn()
  render(<MainPageProfileXboxLinked summary={null} isLoading={false} error="private" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.xbox.profileError)
  expect(screen.getByText(en.xbox.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.xbox.retry }))
  expect(onRetry).toHaveBeenCalled()
})

test('the latest achievements leave out the games on the consoles unticked in preferences', () => {
  window.localStorage.setItem('hidden-consoles:xbox', '["Xbox 360"]')
  ;(useXboxGamesData as jest.Mock).mockReturnValue({
    library: [], fullLibrary: [{ id: 1, consoleName: 'Xbox 360' }, { id: 2, consoleName: 'Xbox Series' }], libraryLoading: false,
  })
  ;(useXboxRecentAchievements as jest.Mock).mockReturnValue({ achievements: [{ gameId: 1 }, { gameId: 2 }], isLoading: false, error: null, retry: jest.fn() })
  render(<MainPageProfileXboxLinked summary={SUMMARY} isLoading={false} error={null} onRetry={jest.fn()} />)
  expect(screen.getByTestId('achievements')).toHaveTextContent(/^2$/)
  window.localStorage.clear()
})
