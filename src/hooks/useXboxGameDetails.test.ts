import { createElement, type ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { useXboxGameDetails } from './useXboxGameDetails'
import { SubjectContext } from '@/context/SubjectContext'

const DETAILS = { summary: 'A game', developers: [], publishers: [], genres: [], releaseDate: null, screenshots: [] }

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => DETAILS })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('asks for nothing without a game', () => {
  const { result } = renderHook(() => useXboxGameDetails(null))
  expect(result.current).toEqual({ details: null, error: null })
  expect(global.fetch).not.toHaveBeenCalled()
})

test('loads the details of a game', async () => {
  const { result } = renderHook(() => useXboxGameDetails('1738914043'))
  await waitFor(() => expect(result.current.details).toEqual(DETAILS))
  expect(global.fetch).toHaveBeenCalledWith('/api/xbox/details?id=1738914043')
})

test('a 404 is no details, not an error', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })
  const { result } = renderHook(() => useXboxGameDetails('1738914043'))
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(result.current).toEqual({ details: null, error: null })
})

test('a failure is kept, and the page goes on without details', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
  const { result } = renderHook(() => useXboxGameDetails('1738914043'))
  await waitFor(() => expect(result.current.error).not.toBeNull())
  expect(result.current.details).toBeNull()
})

test('another game starts over, and a slower answer for the previous one does not land', async () => {
  const { result, rerender } = renderHook(({ id }) => useXboxGameDetails(id), { initialProps: { id: '1' as string | null } })
  await waitFor(() => expect(result.current.details).toEqual(DETAILS))
  rerender({ id: '2' })
  await waitFor(() => expect(global.fetch).toHaveBeenLastCalledWith('/api/xbox/details?id=2'))
})

test("on a public profile it asks as them", async () => {
  const wrapper = ({ children }: { children: ReactNode }) => createElement(SubjectContext.Provider, { value: 'ivan' }, children)
  renderHook(() => useXboxGameDetails('1738914043'), { wrapper })
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/xbox/details?id=1738914043&user=ivan'))
})
