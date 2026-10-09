jest.mock('@/hooks/usePsnTrophies', () => ({ usePsnTrophies: jest.fn() }))
jest.mock('@/components/game-achievements-progress-chart/GameAchievementsProgressChart', () => ({
  GameAchievementsProgressChart: () => <div data-testid="chart" />,
}))
jest.mock('@/components/psn/psn-trophy-grid/PsnTrophyGrid', () => ({
  PsnTrophyGrid: ({ trophies }: { trophies: unknown[] }) => <div data-testid="grid">{trophies.length}</div>,
}))
jest.mock('@/components/psn/psn-rarest-trophies/PsnRarestTrophies', () => ({ __esModule: true, default: () => <div data-testid="rarest" /> }))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnRecentlyPlayedExpanded from './PsnRecentlyPlayedExpanded'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { en } from '@/translations/en'
import type { PsnGameProgress } from '@/types/psn'

const GAME = {
  _source: 'psn', id: 100, titleId: 'NPWR00001_00', service: 'trophy2', title: 'Astro Bot', imageIcon: '',
  consoleName: 'PS5', maxPossible: 10, numAwarded: 4, pctWon: 40, lastPlayed: null,
  earned: { bronze: 4, silver: 0, gold: 0, platinum: 0 }, defined: { bronze: 9, silver: 0, gold: 0, platinum: 1 },
} as PsnGameProgress
const retry = jest.fn()

function setTrophies(overrides: Record<string, unknown> = {}) {
  ;(usePsnTrophies as jest.Mock).mockReturnValue({
    trophies: [{ id: 0, earned: true, groupId: 'default' }, { id: 1, earned: false, groupId: 'default' }],
    groups: [],
    isLoading: false,
    error: null,
    retry,
    ...overrides,
  })
}

beforeEach(() => jest.clearAllMocks())

test("loads the game's trophies and lays out the dashboard", () => {
  setTrophies()
  render(<PsnRecentlyPlayedExpanded game={GAME} />)
  expect(usePsnTrophies).toHaveBeenCalledWith('NPWR00001_00')
  expect(screen.getByTestId('grid')).toHaveTextContent('2')
  expect(screen.getByTestId('chart')).toBeInTheDocument()
  expect(screen.getByTestId('rarest')).toBeInTheDocument()
})

test('a failed load can be retried', () => {
  setTrophies({ trophies: [], error: 'failed' })
  render(<PsnRecentlyPlayedExpanded game={GAME} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.trophiesError)
  fireEvent.click(screen.getByRole('button', { name: en.psn.retry }))
  expect(retry).toHaveBeenCalled()
})

test('while loading, a skeleton the size of the set', () => {
  setTrophies({ trophies: [], isLoading: true })
  const { container } = render(<PsnRecentlyPlayedExpanded game={GAME} />)
  expect(container.querySelectorAll('[aria-busy="true"] li')).toHaveLength(10)
})

test('with DLC, the ring counts the base game only, as "completed" does', () => {
  setTrophies({
    trophies: [
      { id: 0, earned: true, groupId: 'default' },
      { id: 1, earned: true, groupId: 'default' },
      { id: 2, earned: false, groupId: '001' },
    ],
    groups: [{ id: 'default' }, { id: '001' }],
  })
  render(<PsnRecentlyPlayedExpanded game={GAME} />)
  expect(screen.getByText('2/2', { exact: false })).toBeInTheDocument()
})
