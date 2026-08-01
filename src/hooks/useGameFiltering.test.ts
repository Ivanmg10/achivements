import { renderHook } from '@testing-library/react'
import { useGameFiltering } from './useGameFiltering'

const playingGames = [
  { GameID: 1, Title: 'Beta Game', ConsoleID: 21, PctWon: '0.5', HardcoreMode: '0' },
  { GameID: 2, Title: 'Alpha Game', ConsoleID: 22, PctWon: '0.8', HardcoreMode: '1' },
] as any

const wantToPlayGames = [
  { GameID: 3, Title: 'Zeta Game', ConsoleID: 21, PointsTotal: 100 },
  { GameID: 4, Title: 'Alpha Want', ConsoleID: 21, PointsTotal: 300 },
] as any

function setup(overrides: Partial<Parameters<typeof useGameFiltering>[0]> = {}) {
  return renderHook(() =>
    useGameFiltering({
      games: playingGames,
      cat: 'playing',
      extraData: new Map(),
      selected: new Set(),
      completedMode: 'all',
      sortState: { key: 'name', dir: 'asc' },
      ...overrides,
    }),
  )
}

test('filters by selected consoles', () => {
  const { result } = setup({ selected: new Set([22]) })
  expect(result.current.map((g) => g.Title)).toEqual(['Alpha Game'])
})

test('filters by hardcore/softcore mode only for completed category', () => {
  const { result } = setup({ cat: 'completed', completedMode: 'hardcore' })
  expect(result.current.map((g) => g.Title)).toEqual(['Alpha Game'])
})

test('ignores completedMode filter outside the completed category', () => {
  const { result } = setup({ completedMode: 'hardcore' })
  expect(result.current.map((g) => g.Title)).toEqual(['Alpha Game', 'Beta Game'])
})

test('sorts by name ascending', () => {
  const { result } = setup({ sortState: { key: 'name', dir: 'asc' } })
  expect(result.current.map((g) => g.Title)).toEqual(['Alpha Game', 'Beta Game'])
})

test('sorts by name descending', () => {
  const { result } = setup({ sortState: { key: 'name', dir: 'desc' } })
  expect(result.current.map((g) => g.Title)).toEqual(['Beta Game', 'Alpha Game'])
})

test('sorts by percent descending by default direction', () => {
  const { result } = setup({ sortState: { key: 'percent', dir: 'desc' } })
  expect(result.current.map((g) => g.Title)).toEqual(['Alpha Game', 'Beta Game'])
})

test('sorts by lastPlayed, putting games with unknown lastPlayed last', () => {
  const extraData = new Map([[1, { awards: [], lastPlayed: '2024-01-01' }]])
  const { result } = setup({ extraData, sortState: { key: 'lastPlayed', dir: 'desc' } })
  expect(result.current.map((g) => g.Title)).toEqual(['Beta Game', 'Alpha Game'])
})

test('sorts want-to-play games by points using PointsTotal', () => {
  const { result } = renderHook(() =>
    useGameFiltering({
      games: wantToPlayGames,
      cat: 'wantToPlay',
      extraData: new Map(),
      selected: new Set(),
      completedMode: 'all',
      sortState: { key: 'points', dir: 'desc' },
    }),
  )
  expect(result.current.map((g) => g.Title)).toEqual(['Alpha Want', 'Zeta Game'])
})

test('now sorts want-to-play games too, unlike before this feature existed', () => {
  const { result } = renderHook(() =>
    useGameFiltering({
      games: wantToPlayGames,
      cat: 'wantToPlay',
      extraData: new Map(),
      selected: new Set(),
      completedMode: 'all',
      sortState: { key: 'name', dir: 'asc' },
    }),
  )
  expect(result.current.map((g) => g.Title)).toEqual(['Alpha Want', 'Zeta Game'])
})
