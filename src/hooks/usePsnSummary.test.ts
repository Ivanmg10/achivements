import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePsnSummary } from './usePsnSummary'

function setSession(user: Record<string, unknown>) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: jest.fn() })
}

const SUMMARY = { onlineId: 'Hakoom', avatarUrl: null, trophyLevel: 412, earned: {}, games: 3 }

beforeEach(() => {
  jest.clearAllMocks()
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
  await waitFor(() => expect(result.current.summary).toEqual(SUMMARY))
  rerender()
  expect(global.fetch).toHaveBeenCalledTimes(1)
  expect(global.fetch).toHaveBeenCalledWith('/api/psn/summary')
})

test('keeps the reason a load failed', async () => {
  setSession({ id: '7', psnaccountid: '42' })
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: 'private' }) })
  const { result } = renderHook(() => usePsnSummary())
  await waitFor(() => expect(result.current.error).toBe('private'))
  expect(result.current.summary).toBeNull()
})
