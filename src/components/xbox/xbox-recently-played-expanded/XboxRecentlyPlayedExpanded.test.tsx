jest.mock('@/hooks/useXboxAchievements', () => ({ useXboxAchievements: jest.fn() }))
jest.mock('@/components/game-achievements-progress-chart/GameAchievementsProgressChart', () => ({
  GameAchievementsProgressChart: () => <div data-testid="chart" />,
}))
jest.mock('@/components/xbox/xbox-achievement-grid/XboxAchievementGrid', () => ({
  XboxAchievementGrid: ({ achievements }: { achievements: unknown[] }) => <div data-testid="grid">{achievements.length}</div>,
}))
jest.mock('@/components/xbox/xbox-rarest-achievements/XboxRarestAchievements', () => ({ __esModule: true, default: () => <div data-testid="rarest" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import XboxRecentlyPlayedExpanded from './XboxRecentlyPlayedExpanded'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const GAME = xboxGameFixture({ title: 'Halo', numAwarded: 4, maxPossible: 10, totalKnown: true, earnedGamerscore: 100, totalGamerscore: 1000 })
const retry = jest.fn()

function setAchievements(overrides: Record<string, unknown> = {}) {
  ;(useXboxAchievements as jest.Mock).mockReturnValue({
    achievements: [{ id: '0', unlocked: true, unlockedAt: '2026-01-01' }, { id: '1', unlocked: false, unlockedAt: null }],
    isLoading: false,
    error: null,
    retry,
    ...overrides,
  })
}

beforeEach(() => jest.clearAllMocks())

test("loads the game's achievements and lays out the dashboard", () => {
  setAchievements()
  render(<XboxRecentlyPlayedExpanded game={GAME} />)
  expect(useXboxAchievements).toHaveBeenCalledWith('1738914043')
  expect(screen.getByTestId('grid')).toHaveTextContent('2')
  expect(screen.getByTestId('chart')).toBeInTheDocument()
  expect(screen.getByTestId('rarest')).toBeInTheDocument()
  expect(screen.getByText('G', { selector: 'abbr span' })).toBeInTheDocument()
})

test('a failed load can be retried', () => {
  setAchievements({ achievements: [], error: 'failed' })
  render(<XboxRecentlyPlayedExpanded game={GAME} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.xbox.achievementsError)
  fireEvent.click(screen.getByRole('button', { name: en.xbox.retry }))
  expect(retry).toHaveBeenCalled()
})

test('while loading, a skeleton the size of the set', () => {
  setAchievements({ achievements: [], isLoading: true })
  const { container } = render(<XboxRecentlyPlayedExpanded game={GAME} />)
  expect(container.querySelectorAll('[aria-busy="true"] li')).toHaveLength(10)
})

test('a game whose count the list does not know still has a skeleton, and the loaded count takes over', () => {
  const unknown = xboxGameFixture({ maxPossible: 0, totalKnown: false, numAwarded: 15 })
  setAchievements({ achievements: [], isLoading: true })
  const { container, rerender } = render(<XboxRecentlyPlayedExpanded game={unknown} />)
  expect(container.querySelectorAll('[aria-busy="true"] li')).toHaveLength(24)
  setAchievements()
  rerender(<XboxRecentlyPlayedExpanded game={unknown} />)
  expect(screen.getByText('1/2', { exact: false })).toBeInTheDocument()
})

test('a loaded game with no achievements says so', () => {
  setAchievements({ achievements: [] })
  render(<XboxRecentlyPlayedExpanded game={GAME} />)
  expect(screen.getByText(en.xbox.noAchievements)).toBeInTheDocument()
})
