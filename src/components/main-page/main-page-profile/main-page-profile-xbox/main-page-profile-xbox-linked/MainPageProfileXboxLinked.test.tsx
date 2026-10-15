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
  default: () => <div data-testid="achievements" />,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import MainPageProfileXboxLinked from './MainPageProfileXboxLinked'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxRecentAchievements } from '@/hooks/useXboxRecentAchievements'
import { en } from '@/translations/en'
import { SubjectContext } from '@/context/SubjectContext'
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

test('a skeleton while loading', () => {
  const { container } = render(<MainPageProfileXboxLinked summary={null} isLoading error={null} onRetry={jest.fn()} />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
})

test('a failure says why and retries', () => {
  const onRetry = jest.fn()
  render(<MainPageProfileXboxLinked summary={null} isLoading={false} error="private" onRetry={onRetry} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.xbox.profileError)
  expect(screen.getByText(en.xbox.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.xbox.retry }))
  expect(onRetry).toHaveBeenCalled()
})

test('while the library loads, the last-game block keeps its place with a skeleton', () => {
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ library: [], libraryLoading: true })
  const { container } = render(<MainPageProfileXboxLinked summary={SUMMARY} isLoading={false} error={null} onRetry={jest.fn()} />)
  expect(screen.queryByTestId('game')).not.toBeInTheDocument()
  expect(container.querySelector('.animate-pulse [class*="w-12.5"]')).toBeInTheDocument()
})

describe('the refresh button', () => {
  const refreshName = en.profileRa.refreshData

  test('on the own page it refetches the profile, the latest achievements and the library together', () => {
    const retry = jest.fn()
    const refetch = jest.fn()
    const onRetry = jest.fn()
    ;(useXboxRecentAchievements as jest.Mock).mockReturnValue({ achievements: [], isLoading: false, error: null, retry })
    ;(useXboxGamesData as jest.Mock).mockReturnValue({ library: [], libraryLoading: false, refetch })
    render(<MainPageProfileXboxLinked summary={SUMMARY} isLoading={false} error={null} onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: refreshName }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(retry).toHaveBeenCalledTimes(1)
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  test('on someone else page there is nothing of the viewer to refresh', () => {
    render(
      <SubjectContext.Provider value="someone">
        <MainPageProfileXboxLinked summary={SUMMARY} isLoading={false} error={null} onRetry={jest.fn()} />
      </SubjectContext.Provider>,
    )
    expect(screen.queryByRole('button', { name: refreshName })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: en.xbox.viewOnXbox })).toBeInTheDocument()
  })
})
