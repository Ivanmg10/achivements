import { act, renderHook, waitFor } from '@testing-library/react'
import { useFollowers } from './useFollowers'

const CARDS = { friends: [{ username: 'fan', ra: true }], details: { fan: { recent: [], games: [], lastPlayed: null, partial: false } } }

beforeEach(() => {
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('asks for your followers\' cards once enabled, and only then, in one request (#101)', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => CARDS })
  const { result, rerender } = renderHook(({ on }) => useFollowers(on), { initialProps: { on: false } })
  expect(global.fetch).not.toHaveBeenCalled()
  expect(result.current.isLoading).toBe(false)
  rerender({ on: true })
  expect(result.current).toMatchObject({ isLoading: true, detailsLoading: true })
  await waitFor(() => expect(result.current.followers).toEqual(CARDS.friends))
  expect(result.current.details.fan).toMatchObject({ recent: [], games: [], lastPlayed: null })
  expect(result.current.detailsLoading).toBe(false)
  expect((global.fetch as jest.Mock).mock.calls.map((c) => c[0])).toEqual(['/api/follows/cards?lang=en&who=followers'])
})

test('a failure is an error until retried', async () => {
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: false, status: 500 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ friends: [], details: {} }) })
  const { result } = renderHook(() => useFollowers(true))
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.followers).toEqual([]))
  expect(result.current.error).toBe(false)
})
