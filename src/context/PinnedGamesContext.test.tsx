import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { PinnedGamesProvider, usePinnedGames } from './PinnedGamesContext'

global.fetch = jest.fn()

function wrapper({ children }: { children: React.ReactNode }) {
  return <PinnedGamesProvider>{children}</PinnedGamesProvider>
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('returns defaults when used outside the provider', () => {
  const { result } = renderHook(() => usePinnedGames())
  expect(result.current.pinnedIds).toEqual([])
  expect(result.current.isPinned(1)).toBe(false)
})

test('does not fetch when unauthenticated', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
  const { result } = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current.pinnedIds).toEqual([])
})

test('fetches pinned game ids once when authenticated', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [{ game_id: 10, position: 0 }, { game_id: 20, position: 1 }],
  })

  const { result, rerender } = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.pinnedIds).toEqual([10, 20])
  expect(result.current.isPinned(10)).toBe(true)
  expect(result.current.isPinned(99)).toBe(false)

  rerender()
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('sets empty pinnedIds when the GET response is not ok', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false })

  const { result } = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.pinnedIds).toEqual([])
})

test('pinGame adds the id optimistically and POSTs it', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: true })

  const { result } = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  await act(async () => {
    await result.current.pinGame(5)
  })

  expect(fetch).toHaveBeenLastCalledWith('/api/pinnedGames', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId: 5 }),
  })
  expect(result.current.pinnedIds).toEqual([5])
})

test('pinGame reverts the optimistic add and rethrows when the POST fails', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: false })

  const { result } = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  await act(async () => {
    await expect(result.current.pinGame(5)).rejects.toThrow('Error pinning game')
  })
  expect(result.current.pinnedIds).toEqual([])
})

test('unpinGame removes the id optimistically and DELETEs it', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => [{ game_id: 5, position: 0 }] })
    .mockResolvedValueOnce({ ok: true })

  const { result } = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(result.current.pinnedIds).toEqual([5]))

  await act(async () => {
    await result.current.unpinGame(5)
  })

  expect(fetch).toHaveBeenLastCalledWith('/api/pinnedGames?gameId=5', { method: 'DELETE' })
  expect(result.current.pinnedIds).toEqual([])
})

test('unpinGame restores the id and rethrows when the DELETE fails', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => [{ game_id: 5, position: 0 }] })
    .mockResolvedValueOnce({ ok: false })

  const { result } = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(result.current.pinnedIds).toEqual([5]))

  await act(async () => {
    await expect(result.current.unpinGame(5)).rejects.toThrow('Error unpinning game')
  })
  expect(result.current.pinnedIds).toEqual([5])
})

test('reorder PUTs the new order and updates state optimistically', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: true })

  const { result } = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  await act(async () => {
    await result.current.reorder([30, 10, 20])
  })

  expect(fetch).toHaveBeenLastCalledWith('/api/pinnedGames', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: [30, 10, 20] }),
  })
  expect(result.current.pinnedIds).toEqual([30, 10, 20])
})

test('reorder throws when the PUT response is not ok', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: false })

  const { result } = renderHook(() => usePinnedGames(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  await act(async () => {
    await expect(result.current.reorder([1])).rejects.toThrow('Error saving order')
  })
})
