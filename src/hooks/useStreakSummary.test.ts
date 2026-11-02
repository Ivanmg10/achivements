import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useStreakSummary, hiddenParam } from './useStreakSummary'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { useStorageValue } from '@/hooks/useStorageValue'
import { useHiddenGames } from '@/context/HiddenGamesContext'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))
jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn() }))
jest.mock('@/hooks/useStorageValue', () => ({ useStorageValue: jest.fn() }))
jest.mock('@/context/HiddenGamesContext', () => ({ useHiddenGames: jest.fn() }))

const SUMMARY = { active: { start: '2026-11-01', end: '2026-11-02', days: 2 }, best: { start: '2026-10-01', end: '2026-10-09', days: 9 }, failed: [] }
let stored: Record<string, string | null | undefined>

beforeEach(() => {
  jest.clearAllMocks()
  stored = { 'hidden-consoles:ra': null, 'hidden-consoles:psn': null, 'hidden-consoles:xbox': null }
  ;(useStorageValue as jest.Mock).mockImplementation((key: string) => [stored[key], jest.fn()])
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { rausername: 'me' } } })
  ;(useHiddenGames as jest.Mock).mockReturnValue({ revision: 0 })
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(SUMMARY)
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('reads the streak once and gives the days', async () => {
  const { result } = renderHook(() => useStreakSummary())
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current).toMatchObject({ streak: 2, best: 9, error: false })
  expect(fetchWithRetry).toHaveBeenCalledTimes(1)
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/me/streak?lang=en')
})

test('sends the consoles unticked in this browser', async () => {
  stored['hidden-consoles:psn'] = '["PS3"]'
  renderHook(() => useStreakSummary())
  await waitFor(() => expect(fetchWithRetry).toHaveBeenCalled())
  expect(fetchWithRetry).toHaveBeenCalledWith(`/api/me/streak?lang=en&hidden=${encodeURIComponent('{"psn":["PS3"]}')}`)
})

test('waits for the browser\'s lists, and asks nothing signed out', () => {
  stored['hidden-consoles:ra'] = undefined
  renderHook(() => useStreakSummary())
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null })
  stored['hidden-consoles:ra'] = null
  renderHook(() => useStreakSummary())
  expect(fetchWithRetry).not.toHaveBeenCalled()
})

test('a game hidden or shown reads it again, keeping the last streak meanwhile', async () => {
  const { result, rerender } = renderHook(() => useStreakSummary())
  await waitFor(() => expect(result.current.streak).toBe(2))
  ;(useHiddenGames as jest.Mock).mockReturnValue({ revision: 1 })
  rerender()
  expect(result.current.streak).toBe(2)
  await waitFor(() => expect(fetchWithRetry).toHaveBeenCalledTimes(2))
})

test('a failed read says so, shows no streak and can be retried', async () => {
  ;(fetchWithRetry as jest.Mock).mockRejectedValueOnce(new Error('HTTP 502'))
  const { result } = renderHook(() => useStreakSummary())
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.streak).toBe(0)
  result.current.retry()
  await waitFor(() => expect(result.current.streak).toBe(2))
})

test('hiddenParam keeps only real lists', () => {
  expect(hiddenParam({ ra: null, psn: null, xbox: null })).toBe('')
  expect(hiddenParam({ ra: '["SNES"]', psn: 'nope', xbox: '[]' })).toBe('{"ra":["SNES"]}')
})
