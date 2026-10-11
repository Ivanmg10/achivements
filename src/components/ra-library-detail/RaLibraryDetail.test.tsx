const mockDetail = jest.fn()
jest.mock('@/components/library-game-detail/LibraryGameDetail', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockDetail(props)
    return <div data-testid="detail">{props.grid as never}{props.errorNode as never}</div>
  },
}))
jest.mock('@/components/achievement-grid/AchievementGrid', () => ({
  AchievementGrid: ({ achievements, total }: { achievements: { Title: string }[]; total: number }) => (
    <div data-testid="grid">{achievements.map((a) => a.Title).join(',')}:{total}</div>
  ),
}))
jest.mock('@/components/ui/SectionFallback', () => ({
  SectionFallback: ({ onRefresh }: { onRefresh: () => void }) => <button onClick={onRefresh}>retry</button>,
}))

import { fireEvent, render, screen } from '@testing-library/react'
import RaLibraryDetail from './RaLibraryDetail'
import { en } from '@/translations/en'
import type { CategoryGame } from '@/hooks/useGamesByCategory'
import type { RetroAchievementsGameWithAchievements } from '@/types/types'

const PLAYED = { GameID: 5, Title: 'Sonic', NumAwarded: 3, MaxPossible: 10 } as CategoryGame
const WANTED = { ID: 6, Title: 'Zelda', AchievementsPublished: 20 } as CategoryGame
const ra = (id: number, order: number, earned: boolean) => ({ ID: id, Title: `A${id}`, Description: '', DisplayOrder: order, NumAwarded: 10, Points: 5, BadgeName: '', DateEarned: earned ? '2024-01-01' : null })
const DATA = {
  NumDistinctPlayers: 1000,
  Achievements: { 1: ra(1, 2, true), 2: ra(2, 1, false), 3: undefined },
} as unknown as RetroAchievementsGameWithAchievements
const last = () => mockDetail.mock.calls.at(-1)![0]
const props = { gameId: 5, data: null, loading: false, onRetry: jest.fn() }

beforeEach(() => mockDetail.mockClear())

test('before the answer the ring goes by what the list knows: played games and unplayed ones', () => {
  const { rerender } = render(<RaLibraryDetail {...props} game={PLAYED} category="playing" loading />)
  expect(last()).toMatchObject({ state: 'loading', ring: { earned: 3, total: 10 }, facts: [] })
  rerender(<RaLibraryDetail {...props} game={WANTED} gameId={6} category="wantToPlay" loading />)
  expect(last()).toMatchObject({ ring: { earned: 0, total: 20 } })
})

test('once loaded, it counts the achievements, lists them in game order and shows the players', () => {
  render(<RaLibraryDetail {...props} game={PLAYED} category="completed" data={DATA} />)
  expect(last()).toMatchObject({ category: 'completed', state: 'ready', ring: { earned: 1, total: 2 } })
  expect(last().facts).toEqual([{ label: en.libraryDetail.players, value: (1000).toLocaleString('en') }])
  expect(screen.getByTestId('grid')).toHaveTextContent('A2,A1:2')
})

test('turns each achievement\'s awards into a rarity', () => {
  render(<RaLibraryDetail {...props} game={PLAYED} data={DATA} />)
  expect((last().items as { rarity: number }[]).map((i) => i.rarity)).toEqual([1, 1])
})

test('failing without an answer is an error that can be retried; failing with one keeps it', () => {
  const onRetry = jest.fn()
  const { rerender } = render(<RaLibraryDetail {...props} game={PLAYED} error onRetry={onRetry} />)
  expect(last().state).toBe('error')
  fireEvent.click(screen.getByRole('button', { name: 'retry' }))
  expect(onRetry).toHaveBeenCalled()
  rerender(<RaLibraryDetail {...props} game={PLAYED} error data={DATA} />)
  expect(last().state).toBe('ready')
})

test('an unknown list is shown as in progress', () => {
  render(<RaLibraryDetail {...props} game={PLAYED} category="whatever" data={DATA} />)
  expect(last().category).toBe('playing')
})
