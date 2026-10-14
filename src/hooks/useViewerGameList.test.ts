import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useViewerGameList } from './useViewerGameList'
import { useGameProgression } from '@/hooks/useGameProgression'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'

jest.mock('@/hooks/useGameProgression', () => ({ useGameProgression: jest.fn() }))
jest.mock('@/hooks/useSteamAchievements', () => ({ useSteamAchievements: jest.fn() }))
jest.mock('@/hooks/usePsnTrophies', () => ({ usePsnTrophies: jest.fn() }))

const RA_GAME = { ID: 1, NumDistinctPlayers: 1, Achievements: { 5: { ID: 5, Title: 'A', DisplayOrder: 1, NumAwarded: 1, DateEarned: '2026-01-01' } } }
const refetch = jest.fn()
const retry = jest.fn()

function setup(user: Record<string, unknown>, { ra = {}, steam = {}, psn = {} } = {}) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated' })
  ;(useGameProgression as jest.Mock).mockReturnValue({ game: RA_GAME, isLoading: false, error: false, refetch, ...ra })
  ;(useSteamAchievements as jest.Mock).mockReturnValue({ achievements: [], isLoading: false, error: null, retry, ...steam })
  ;(usePsnTrophies as jest.Mock).mockReturnValue({ trophies: [], isLoading: false, error: null, retry, ...psn })
}

beforeEach(() => jest.clearAllMocks())

test('your RA progress in the game, asked only for that platform', () => {
  setup({ raLinked: true })
  const { result } = renderHook(() => useViewerGameList('ra', '1', true))
  expect(useGameProgression).toHaveBeenCalledWith('1')
  expect(useSteamAchievements).toHaveBeenCalledWith(null)
  expect(usePsnTrophies).toHaveBeenCalledWith(null)
  expect(result.current.list).toEqual([expect.objectContaining({ id: '5', earned: true })])
  expect(result.current.linked).toBe(true)
})

test('nothing is asked when not comparing, or without that platform', () => {
  setup({ raLinked: true })
  expect(renderHook(() => useViewerGameList('ra', '1', false)).result.current.list).toBeNull()
  expect(useGameProgression).toHaveBeenLastCalledWith(null)
  setup({})
  const { result } = renderHook(() => useViewerGameList('steam', '730', true))
  expect(useSteamAchievements).toHaveBeenLastCalledWith(null)
  expect(result.current).toMatchObject({ list: null, linked: false, isLoading: false, error: false })
})

test('a stale RA game is not yours yet', () => {
  setup({ raLinked: true }, { ra: { game: { ...RA_GAME, ID: 2 }, isLoading: true } })
  const { result } = renderHook(() => useViewerGameList('ra', '1', true))
  expect(result.current).toMatchObject({ list: null, isLoading: true })
})

test('Steam: your list, or none when you do not own it', () => {
  setup({ steamid: '765' }, { steam: { achievements: [{ apiname: 'A', title: 'a', description: '', badgeUrl: '', displayOrder: 1, earned: true, dateEarned: null, globalPct: null }] } })
  expect(renderHook(() => useViewerGameList('steam', '730', true)).result.current.list).toHaveLength(1)
  expect(useSteamAchievements).toHaveBeenLastCalledWith(730)
  setup({ steamid: '765' }, { steam: { error: 'Failed (403)' } })
  const { result } = renderHook(() => useViewerGameList('steam', '730', true))
  expect(result.current).toMatchObject({ list: null, error: true })
  result.current.retry()
  expect(retry).toHaveBeenCalled()
})

test('PSN: your trophies, or none when you never played it', () => {
  setup({ psnaccountid: 'x' }, { psn: { trophies: [{ id: 1, name: 'T', detail: '', iconUrl: null, type: 'gold', earned: false, earnedAt: null, rarity: 2 }] } })
  expect(renderHook(() => useViewerGameList('psn', 'NPWR20188_00', true)).result.current.list).toHaveLength(1)
  expect(usePsnTrophies).toHaveBeenLastCalledWith('NPWR20188_00')
  setup({ psnaccountid: 'x' }, { psn: { error: 'failed', isLoading: false } })
  expect(renderHook(() => useViewerGameList('psn', 'NPWR20188_00', true)).result.current).toMatchObject({ list: null, error: true })
})
