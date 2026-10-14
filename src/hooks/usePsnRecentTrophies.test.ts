import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePsnRecentTrophies } from './usePsnRecentTrophies'
import { createElement, type ReactNode } from 'react'
import { SubjectContext } from '@/context/SubjectContext'

function setSession(user: Record<string, unknown>) {
  ;(useSession as jest.Mock).mockReturnValue({ data: { user }, status: 'authenticated', update: jest.fn() })
}

const TROPHIES = [{ trophyId: 1 }]

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => TROPHIES })
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('without PSN linked, or with no scope, asks for nothing', () => {
  setSession({ id: '7' })
  const { result } = renderHook(() => usePsnRecentTrophies('year'))
  expect(result.current).toMatchObject({ trophies: [], isLoading: false })
  setSession({ id: '7', psnaccountid: '42' })
  renderHook(() => usePsnRecentTrophies(null))
  expect(global.fetch).not.toHaveBeenCalled()
})

test('loads the scope it is given', async () => {
  setSession({ id: '7', psnaccountid: '42' })
  const { result } = renderHook(() => usePsnRecentTrophies('activity'))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.trophies).toEqual(TROPHIES))
  expect(global.fetch).toHaveBeenCalledWith('/api/psn/recentTrophies?scope=activity&lang=en', { cache: 'no-store' })
})

test('keeps the reason a load failed', async () => {
  setSession({ id: '7', psnaccountid: '42' })
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 502, json: async () => ({ error: 'failed' }) })
  const { result } = renderHook(() => usePsnRecentTrophies())
  await waitFor(() => expect(result.current.error).toBe('failed'))
  expect(result.current.isLoading).toBe(false)
})

test("on a public profile (an account id with a colon in it) it still asks for the right scope, as them", async () => {
  setSession({ id: 'subject:ivan', psnaccountid: 'subject:ivan' })
  const wrapper = ({ children }: { children: ReactNode }) => createElement(SubjectContext.Provider, { value: 'ivan' }, children)
  const { result } = renderHook(() => usePsnRecentTrophies('year'), { wrapper })
  await waitFor(() => expect(result.current.trophies).toEqual(TROPHIES))
  expect(global.fetch).toHaveBeenCalledWith('/api/psn/recentTrophies?scope=year&lang=en&user=ivan', { cache: 'no-store' })
})
