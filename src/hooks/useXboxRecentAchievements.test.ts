import { createElement, type ReactNode } from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useXboxRecentAchievements } from './useXboxRecentAchievements'
import { SubjectContext } from '@/context/SubjectContext'

function setSession(user: Record<string, unknown>) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: jest.fn() })
}

const FEED = [{ achievementId: '1' }]

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => FEED })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('without Xbox linked, for a non-admin, or with no scope, asks for nothing', () => {
  setSession({ id: '7', admin: true })
  expect(renderHook(() => useXboxRecentAchievements('year')).result.current).toMatchObject({ achievements: [], isLoading: false })
  setSession({ id: '7', xboxxuid: '25354' })
  renderHook(() => useXboxRecentAchievements('year'))
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  renderHook(() => useXboxRecentAchievements(null))
  expect(global.fetch).not.toHaveBeenCalled()
})

test('loads the scope it is given', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  const { result } = renderHook(() => useXboxRecentAchievements('activity'))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.achievements).toEqual(FEED))
  expect(global.fetch).toHaveBeenCalledWith('/api/xbox/recentAchievements?scope=activity&lang=en', { cache: 'no-store' })
})

test('keeps the reason a load failed, and can retry', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ error: 'rate-limited' }) })
  const { result } = renderHook(() => useXboxRecentAchievements())
  await waitFor(() => expect(result.current.error).toBe('rate-limited'))
  expect(result.current.isLoading).toBe(false)
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.achievements).toEqual(FEED))
  expect(result.current.error).toBeNull()
})

test('a network failure, or an answer that is not a list, is "failed"', async () => {
  setSession({ id: '7', admin: true, xboxxuid: '25354' })
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
  const first = renderHook(() => useXboxRecentAchievements('recent'))
  await waitFor(() => expect(first.result.current.error).toBe('failed'))
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
  const second = renderHook(() => useXboxRecentAchievements('year'))
  await waitFor(() => expect(second.result.current.error).toBe('failed'))
})

test("on a public profile (an account id with a colon in it) it still asks for the right scope, as them", async () => {
  setSession({ id: 'subject:ivan', xboxxuid: 'subject:ivan' })
  const wrapper = ({ children }: { children: ReactNode }) => createElement(SubjectContext.Provider, { value: 'ivan' }, children)
  const { result } = renderHook(() => useXboxRecentAchievements('year'), { wrapper })
  await waitFor(() => expect(result.current.achievements).toEqual(FEED))
  expect(global.fetch).toHaveBeenCalledWith('/api/xbox/recentAchievements?scope=year&lang=en&user=ivan', { cache: 'no-store' })
})
