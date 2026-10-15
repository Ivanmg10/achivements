import { renderHook, waitFor } from '@testing-library/react'
import { usePsnGameDetails } from './usePsnGameDetails'
import { createElement, type ReactNode } from 'react'
import { SubjectContext } from '@/context/SubjectContext'

const DETAILS = { summary: 'x', developers: ['Treyarch'], publishers: [], genres: [], releaseDate: null, screenshots: [] }

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('does nothing without a game', () => {
  const { result } = renderHook(() => usePsnGameDetails(null))
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current).toEqual({ details: null, error: null })
})

test("loads the game's details", async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => DETAILS })
  const { result } = renderHook(() => usePsnGameDetails('NPWR00001_00'))
  await waitFor(() => expect(result.current.details).toEqual(DETAILS))
  expect(fetch).toHaveBeenCalledWith('/api/psn/details?id=NPWR00001_00')
})

test('a 404 is no details, not an error', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 })
  const { result } = renderHook(() => usePsnGameDetails('NPWR00001_00'))
  await waitFor(() => expect(fetch).toHaveBeenCalled())
  await waitFor(() => expect(result.current).toEqual({ details: null, error: null }))
})

test('a failure is kept as an error, and logged', async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 })
  const { result } = renderHook(() => usePsnGameDetails('NPWR00001_00'))
  await waitFor(() => expect(result.current.error).toContain('503'))
  expect(result.current.details).toBeNull()
  expect(console.error).toHaveBeenCalled()
})

test('another game clears the previous details', async () => {
  ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: async () => DETAILS }).mockReturnValue(new Promise(() => {}))
  const { result, rerender } = renderHook(({ id }) => usePsnGameDetails(id), { initialProps: { id: 'NPWR00001_00' } })
  await waitFor(() => expect(result.current.details).toEqual(DETAILS))
  rerender({ id: 'NPWR00002_00' })
  expect(result.current.details).toBeNull()
})

test("on someone's profile it asks by the title in their list", async () => {
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => DETAILS })
  const wrapper = ({ children }: { children: ReactNode }) => createElement(SubjectContext.Provider, { value: 'ivan' }, children)
  const { result } = renderHook(() => usePsnGameDetails('NPWR00001_00'), { wrapper })
  await waitFor(() => expect(result.current.details).toEqual(DETAILS))
  expect(fetch).toHaveBeenCalledWith('/api/psn/details?id=NPWR00001_00&user=ivan')
})
