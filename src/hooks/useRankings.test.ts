import { act, renderHook, waitFor } from '@testing-library/react'
import { useRankings, type RankingsView } from './useRankings'

const page = (offset: number, total = 3) => ({
  scope: 'global', period: 'all', source: 'all', total, offset, arrows: false, me: null, near: [],
  rows: [{ username: `u${offset}`, rank: offset + 1, points: 10 }],
})
const view: RankingsView = { scope: 'global', period: 'all', source: 'all' }

beforeEach(() => {
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('reads the first page of a view, then the next on demand', async () => {
  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => page(0) })
    .mockResolvedValueOnce({ ok: true, json: async () => page(1) })
  const { result } = renderHook(() => useRankings(view))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/rankings?scope=global&period=all&source=all&offset=0')
  expect(result.current.hasMore).toBe(true)

  await act(() => result.current.more())
  expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain('offset=1')
  expect(result.current.rows.map((r) => r.username)).toEqual(['u0', 'u1'])
})

test('a failure is an error until retried', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValueOnce({ ok: true, json: async () => page(0) })
  const { result } = renderHook(() => useRankings(view))
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.rows).toHaveLength(1))
  expect(result.current.error).toBe(false)
})

test('another view starts over', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => page(0) })
  const { result, rerender } = renderHook(({ v }) => useRankings(v), { initialProps: { v: view } })
  await waitFor(() => expect(result.current.rows).toHaveLength(1))
  rerender({ v: { ...view, period: 'week' } })
  expect(result.current.rows).toEqual([])
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect((global.fetch as jest.Mock).mock.calls.at(-1)[0]).toContain('period=week'))
})

test('asks nothing while disabled', () => {
  renderHook(() => useRankings(view, false))
  expect(global.fetch).not.toHaveBeenCalled()
})
