import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePerfectGamesOrder } from './usePerfectGamesOrder'

global.fetch = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

test('does not fetch when unauthenticated', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
  const { result } = renderHook(() => usePerfectGamesOrder())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current.order).toEqual([])
})

test('fetches saved order once when authenticated', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [{ game_id: 10, position: 0 }, { game_id: 20, position: 1 }],
  })

  const { result, rerender } = renderHook(() => usePerfectGamesOrder())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.order).toEqual([10, 20])

  rerender()
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('sets empty order when the GET response is not ok', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false })

  const { result } = renderHook(() => usePerfectGamesOrder())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.order).toEqual([])
})

test('saveOrder PUTs the new order and updates state optimistically', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: true })

  const { result } = renderHook(() => usePerfectGamesOrder())
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  await act(async () => {
    await result.current.saveOrder([30, 10, 20])
  })

  expect(fetch).toHaveBeenLastCalledWith('/api/perfectGamesOrder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: [30, 10, 20] }),
  })
  expect(result.current.order).toEqual([30, 10, 20])
})

test('saveOrder throws when the PUT response is not ok', async () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  ;(fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: false })

  const { result } = renderHook(() => usePerfectGamesOrder())
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  await act(async () => {
    await expect(result.current.saveOrder([1])).rejects.toThrow('Error saving order')
  })
})
