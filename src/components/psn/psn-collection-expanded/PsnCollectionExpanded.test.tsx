jest.mock('@/hooks/usePsnCollectionTrophies', () => ({ usePsnCollectionTrophies: jest.fn() }))
jest.mock('@/components/game-achievements-progress-chart/GameAchievementsProgressChart', () => ({
  GameAchievementsProgressChart: ({ achievements }: { achievements: unknown[] }) => <div data-testid="chart">{achievements.length}</div>,
}))
jest.mock('@/components/psn/psn-trophy-grid/PsnTrophyGrid', () => ({
  PsnTrophyGrid: ({ gameId, trophies }: { gameId: number; trophies: unknown[] }) => <div data-testid={`grid-${gameId}`}>{trophies.length}</div>,
}))
jest.mock('@/components/psn/psn-rarest-trophies/PsnRarestTrophies', () => ({
  __esModule: true,
  default: ({ trophies }: { trophies: { gameId: number }[] }) => <div data-testid="rarest">{trophies.map((t) => t.gameId).join(',')}</div>,
}))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnCollectionExpanded from './PsnCollectionExpanded'
import { usePsnCollectionTrophies } from '@/hooks/usePsnCollectionTrophies'
import { en } from '@/translations/en'
import { psnGameFixture } from '@/test-utils/psnFixtures'

const GAMES = [
  psnGameFixture({ id: 1143600, titleId: 'NPWR11436_00', title: 'Brotherhood', numAwarded: 1, maxPossible: 2 }),
  psnGameFixture({ id: 1143500, titleId: 'NPWR11435_00', title: 'AC II', numAwarded: 1, maxPossible: 1 }),
]
const retry = jest.fn()
const trophy = (id: number, earned: boolean) => ({ id, earned, earnedAt: earned ? '2026-10-06T00:00:00Z' : null, groupId: 'default' })

function setTrophies(overrides: Record<string, unknown> = {}) {
  ;(usePsnCollectionTrophies as jest.Mock).mockReturnValue({
    byGame: {
      NPWR11436_00: { trophies: [trophy(0, true), trophy(1, false)], groups: [] },
      NPWR11435_00: { trophies: [trophy(0, true)], groups: [] },
    },
    isLoading: false,
    error: null,
    retry,
    ...overrides,
  })
}

beforeEach(() => jest.clearAllMocks())

test('the ring, chart and rarest count every game; each game is a fold of its trophies', () => {
  setTrophies()
  render(<PsnCollectionExpanded games={GAMES} />)
  expect(usePsnCollectionTrophies).toHaveBeenCalledWith(['NPWR11436_00', 'NPWR11435_00'])
  expect(screen.getByTestId('chart')).toHaveTextContent('3')
  // Each trophy keeps its game, so the rarest link to the right page.
  expect(screen.getByTestId('rarest')).toHaveTextContent('1143600,1143600,1143500')
  expect(screen.getByText('Brotherhood').closest('summary')).toHaveTextContent('1/2')
  expect(screen.getByText('AC II').closest('summary')).toHaveTextContent('1/1')
  expect(screen.getByTestId('grid-1143600')).toHaveTextContent('2')
  expect(screen.getByTestId('grid-1143500')).toHaveTextContent('1')
})

test('while loading, the ring uses the counts the list already has', () => {
  setTrophies({ byGame: {}, isLoading: true })
  const { container } = render(<PsnCollectionExpanded games={GAMES} />)
  expect(container.querySelector('ul[aria-busy="true"]')).toBeInTheDocument()
  expect(screen.queryByText('Brotherhood')).not.toBeInTheDocument()
})

test('a failure says so and can retry', () => {
  setTrophies({ byGame: {}, error: 'private' })
  render(<PsnCollectionExpanded games={GAMES} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.psn.trophiesError)
  expect(screen.getByText(en.psn.errors.private)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.psn.retry }))
  expect(retry).toHaveBeenCalled()
})
