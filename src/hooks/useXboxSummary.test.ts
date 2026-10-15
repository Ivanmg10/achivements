import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useXboxSummary } from './useXboxSummary'

function setSession(user: Record<string, unknown>) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: jest.fn() })
}

const SUMMARY = { gamertag: 'TestPlayer', avatarUrl: null, bio: '', tier: 'Silver', gamerscore: 10242, achievementsUnlocked: 593, games: 135 }

beforeEach(() => {
  jest.clearAllMocks()
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
  await waitFor(() => expect(result.current.summary).toEqual(SUMMARY))
  rerender()
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(global.fetch).toHaveBeenCalledWith('/api/xbox/summary')
})

test('keeps the reason a load failed, and can retry', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: 'private' }) })
  const { result } = renderHook(() => useXboxSummary())
  await waitFor(() => expect(result.current.error).toBe('private'))
  expect(result.current.summary).toBeNull()
  result.current.retry()
  await waitFor(() => expect(result.current.summary).toEqual(SUMMARY))
})

test('a network failure is "failed"', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  const { result } = renderHook(() => useXboxSummary())
  await waitFor(() => expect(result.current.error).toBe('failed'))
})
