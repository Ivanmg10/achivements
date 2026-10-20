import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useShowcase } from './useShowcase'
import { fetchWithRetry } from '@/lib/fetchWithRetry'
import { notify } from '@/lib/notify'
import { SubjectContext } from '@/context/SubjectContext'
import { en } from '@/translations/en'
import type { ShowcaseEntry, ShowcaseItem } from '@/utils/showcase'

jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn(), scheduleRetry: jest.fn(() => false) }))
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const entry = (k: string): ShowcaseEntry => ({
  source: 'ra', gameId: 1, achievementKey: k, gameTitle: 'Zelda', title: `A${k}`, description: null, badge: null, earnedAt: '2026-10-01T00:00:00.000Z',
})
const item = (k: string, id: number): ShowcaseItem => ({ ...entry(k), id })
const respond = (status: number, body: unknown = {}) =>
  (global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }) as unknown as typeof fetch)

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('loads the user’s own, or a profile’s by name', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([item('1', 1)])
  const { result } = renderHook(() => useShowcase())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.items).toHaveLength(1)
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/showcase')

  const wrapper = ({ children }: { children: ReactNode }) => createElement(SubjectContext.Provider, { value: 'luna' }, children)
  renderHook(() => useShowcase(), { wrapper })
  await waitFor(() => expect(fetchWithRetry).toHaveBeenCalledWith('/api/showcase?user=luna'))
})

test('adds at once, keeps the saved row, and says so', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([])
  const { result } = renderHook(() => useShowcase())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  respond(200, item('2', 9))
  await act(() => result.current.add(entry('2')))
  expect(result.current.items).toEqual([item('2', 9)])
  expect(result.current.has(entry('2'))).toBe(true)
  expect(notify.success).toHaveBeenCalledWith(en.toast.showcaseUpdated)
})

test('full: says so without asking; refused by the server as full: takes it back and says so', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue(['1', '2', '3', '4', '5'].map((k, i) => item(k, i + 1)))
  const { result } = renderHook(() => useShowcase())
  await waitFor(() => expect(result.current.full).toBe(true))
  global.fetch = jest.fn() as unknown as typeof fetch
  await act(() => result.current.add(entry('6')))
  expect(global.fetch).not.toHaveBeenCalled()
  expect(notify.error).toHaveBeenCalledWith(en.toast.showcaseFull)

  ;(fetchWithRetry as jest.Mock).mockResolvedValue([])
  const other = renderHook(() => useShowcase())
  await waitFor(() => expect(other.result.current.isLoading).toBe(false))
  respond(409, { error: 'showcase-full' })
  await act(() => other.result.current.add(entry('7')))
  expect(other.result.current.items).toEqual([])
})

test('a failed remove or reorder goes back, saying so', async () => {
  ;(fetchWithRetry as jest.Mock).mockResolvedValue([item('1', 1), item('2', 2)])
  const { result } = renderHook(() => useShowcase())
  await waitFor(() => expect(result.current.items).toHaveLength(2))
  respond(500)
  await act(() => result.current.remove(item('1', 1)))
  expect(result.current.items).toHaveLength(2)
  expect(notify.error).toHaveBeenCalledWith(en.toast.showcaseFailed)

  await act(() => result.current.reorder([item('2', 2), item('1', 1)]))
  expect(result.current.items.map((i) => i.id)).toEqual([1, 2])
  expect(notify.error).toHaveBeenCalledWith(en.toast.orderFailed)

  respond(200)
  await act(() => result.current.reorder([item('2', 2), item('1', 1)]))
  expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({ order: [2, 1] })
})
