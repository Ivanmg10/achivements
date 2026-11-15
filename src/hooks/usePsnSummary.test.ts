import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePsnSummary } from './usePsnSummary'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { psnGameFixture } from '@/test-utils/psnFixtures'

jest.mock('@/context/PsnGamesDataContext', () => ({ usePsnGamesData: jest.fn() }))

function setSession(user: Record<string, unknown>) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: jest.fn() })
}

const SUMMARY = { onlineId: 'Hakoom', avatarUrl: null, trophyLevel: 412, earned: {}, games: 3 }

beforeEach(() => {
  jest.clearAllMocks()
  ;(usePsnGamesData as jest.Mock).mockReturnValue({ library: [], libraryLoading: false })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => SUMMARY })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('fetches nothing without a linked account', () => {
  setSession({ id: '7' })
  const { result } = renderHook(() => usePsnSummary())
  expect(global.fetch).not.toHaveBeenCalled()
  expect(result.current.summary).toBeNull()
})

test('loads the summary once per linked account', async () => {
  setSession({ id: '7', psnaccountid: '42' })
  const { result, rerender } = renderHook(() => usePsnSummary())
  await waitFor(() => expect(result.current.summary).toMatchObject({ onlineId: 'Hakoom', games: 0 }))
  rerender()
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(global.fetch).toHaveBeenCalledWith('/api/psn/summary')
})

test('game-derived totals come from the visible library while profile identity stays', async () => {
  setSession({ id: '7', psnaccountid: '42' })
  ;(usePsnGamesData as jest.Mock).mockReturnValue({
    library: [
      psnGameFixture({ earned: { bronze: 2, silver: 1, gold: 0, platinum: 1 } }),
      psnGameFixture({ earned: { bronze: 3, silver: 0, gold: 1, platinum: 0 } }),
    ],
    libraryLoading: false,
  })
  const { result } = renderHook(() => usePsnSummary())
  await waitFor(() => expect(result.current.summary).toMatchObject({
    trophyLevel: 412,
    games: 2,
    earned: { bronze: 5, silver: 1, gold: 1, platinum: 1 },
  }))
})

test('keeps the reason a load failed', async () => {
  setSession({ id: '7', psnaccountid: '42' })
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: 'private' }) })
  const { result } = renderHook(() => usePsnSummary())
  await waitFor(() => expect(result.current.error).toBe('private'))
  expect(result.current.summary).toBeNull()
})
