import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useXboxSummary } from './useXboxSummary'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

jest.mock('@/context/XboxGamesDataContext', () => ({ useXboxGamesData: jest.fn() }))

function setSession(user: Record<string, unknown>) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: jest.fn() })
}

const SUMMARY = { gamertag: 'TestPlayer', avatarUrl: null, bio: '', tier: 'Silver', gamerscore: 10242, achievementsUnlocked: 593, games: 135 }

beforeEach(() => {
  jest.clearAllMocks()
  ;(useXboxGamesData as jest.Mock).mockReturnValue({ library: [], libraryLoading: false })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => SUMMARY })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('fetches nothing without a linked account', () => {
  setSession({ id: '7', admin: true })
  const { result } = renderHook(() => useXboxSummary())
  expect(global.fetch).not.toHaveBeenCalled()
  expect(result.current.summary).toBeNull()
})

test('fetches nothing for a user who may not use Xbox, even with an account linked', () => {
  setSession({ id: '7', xboxxuid: '25354' })
  const { result } = renderHook(() => useXboxSummary())
  expect(global.fetch).not.toHaveBeenCalled()
  expect(result.current.summary).toBeNull()
})

test('loads the summary once per linked account', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  const { result, rerender } = renderHook(() => useXboxSummary())
  await waitFor(() => expect(result.current.summary).toMatchObject({ gamertag: 'TestPlayer', games: 0, gamerscore: 0, achievementsUnlocked: 0 }))
  rerender()
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(global.fetch).toHaveBeenCalledWith('/api/xbox/summary')
})

test('game-derived totals come from the visible library while profile identity stays', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  ;(useXboxGamesData as jest.Mock).mockReturnValue({
    library: [
      xboxGameFixture({ earnedGamerscore: 300, numAwarded: 8 }),
      xboxGameFixture({ earnedGamerscore: 150, numAwarded: 4 }),
    ],
    libraryLoading: false,
  })
  const { result } = renderHook(() => useXboxSummary())
  await waitFor(() => expect(result.current.summary).toMatchObject({
    gamertag: 'TestPlayer', tier: 'Silver', games: 2, gamerscore: 450, achievementsUnlocked: 12,
  }))
})

test('keeps the reason a load failed, and can retry', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'private' }) })
  const { result } = renderHook(() => useXboxSummary())
  await waitFor(() => expect(result.current.error).toBe('private'))
  expect(result.current.summary).toBeNull()
  result.current.retry()
  await waitFor(() => expect(result.current.summary).toMatchObject({ gamertag: 'TestPlayer', games: 0, gamerscore: 0, achievementsUnlocked: 0 }))
})

test('a network failure is "failed"', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  const { result } = renderHook(() => useXboxSummary())
  await waitFor(() => expect(result.current.error).toBe('failed'))
})
