import { act, renderHook } from '@testing-library/react'
import { useUserSearch, USER_SEARCH_MIN } from './useUserSearch'

const ROW = { username: 'ivan', avatar: null, ra: true, steam: false, psn: false }
const answer = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 429, json: () => Promise.resolve(body) })

beforeEach(() => {
  jest.useFakeTimers()
  global.fetch = jest.fn().mockResolvedValue(answer([ROW]))
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  jest.useRealTimers()
  ;(console.error as jest.Mock).mockRestore()
})

const settle = () => act(async () => { await jest.advanceTimersByTimeAsync(300) })

test('searches once the user stops typing, not on every key', async () => {
  const { result, rerender } = renderHook(({ q }) => useUserSearch(q, true), { initialProps: { q: 'iva' } })
  rerender({ q: 'ivan' })
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current.isLoading).toBe(true)
  await settle()
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch).toHaveBeenCalledWith('/api/users/search?q=ivan')
  expect(result.current.results).toEqual([ROW])
  expect(result.current.isLoading).toBe(false)
})

test('a short query asks nothing and is not active', () => {
  const { result } = renderHook(() => useUserSearch('iv', true))
  expect(USER_SEARCH_MIN).toBe(3)
  expect(result.current.active).toBe(false)
  expect(result.current.isLoading).toBe(false)
  expect(fetch).not.toHaveBeenCalled()
})

test('disabled asks nothing, whatever is typed', () => {
  const { result } = renderHook(() => useUserSearch('ivan', false))
  expect(result.current.active).toBe(false)
  expect(fetch).not.toHaveBeenCalled()
})

test('spaces around the query are ignored', async () => {
  renderHook(() => useUserSearch('  ivan  ', true))
  await settle()
  expect(fetch).toHaveBeenCalledWith('/api/users/search?q=ivan')
})

test('a new query clears the old results at once', async () => {
  const { result, rerender } = renderHook(({ q }) => useUserSearch(q, true), { initialProps: { q: 'ivan' } })
  await settle()
  expect(result.current.results).toHaveLength(1)
  rerender({ q: 'ivana' })
  expect(result.current.results).toEqual([])
  expect(result.current.isLoading).toBe(true)
})

test('a refused search is an error, which is not the same as no match', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({}, false))
  const { result } = renderHook(() => useUserSearch('ivan', true))
  await settle()
  expect(result.current.error).toBe(true)
  expect(result.current.results).toEqual([])
  expect(result.current.isLoading).toBe(false)
})

test('no match is an empty list without an error', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer([]))
  const { result } = renderHook(() => useUserSearch('nobody', true))
  await settle()
  expect(result.current.error).toBe(false)
  expect(result.current.results).toEqual([])
})

test('an answer for a query that was replaced does not land', async () => {
  let resolveOld!: (v: unknown) => void
  ;(fetch as jest.Mock).mockReturnValueOnce(new Promise((r) => { resolveOld = r }))
  const { result, rerender } = renderHook(({ q }) => useUserSearch(q, true), { initialProps: { q: 'ivan' } })
  await settle()
  ;(fetch as jest.Mock).mockResolvedValue(answer([{ ...ROW, username: 'ivana' }]))
  rerender({ q: 'ivana' })
  await settle()
  await act(async () => { resolveOld(answer([ROW])) })
  expect(result.current.results.map((r) => r.username)).toEqual(['ivana'])
})
