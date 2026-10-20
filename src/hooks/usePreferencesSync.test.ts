jest.mock('@/lib/notify', () => ({ notify: { error: jest.fn(), success: jest.fn() } }))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePreferencesSync } from './usePreferencesSync'
import { applyStoredValue, useStorageValue } from '@/hooks/useStorageValue'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'

function signIn(id: string | null = '7') {
  ;(useSession as jest.Mock).mockReturnValue({ data: id ? { user: { id } } : null, status: id ? 'authenticated' : 'unauthenticated' })
}

function respond(server: Record<string, string>, putOk = true) {
  ;(global.fetch as jest.Mock).mockImplementation(async (_url: string, init?: { method?: string }) => {
    if (init?.method === 'PUT') return { ok: putOk, status: putOk ? 200 : 500, json: async () => ({ preferences: {} }) }
    return { ok: true, status: 200, json: async () => ({ preferences: server }) }
  })
}

const puts = () => (global.fetch as jest.Mock).mock.calls.filter((c) => c[1]?.method === 'PUT').map((c) => JSON.parse(c[1].body).changes)

/** A change the person makes: written through the same hook the components use. */
function userSets(key: string, value: string | null) {
  const { result, unmount } = renderHook(() => useStorageValue(key))
  act(() => result.current[1](value))
  unmount()
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  window.localStorage.clear()
  global.fetch = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.useRealTimers()
  ;(console.error as jest.Mock).mockRestore()
})

test('signed out: nothing is asked and nothing is sent', () => {
  signIn(null)
  renderHook(() => usePreferencesSync())
  userSets('library-layout', 'list')
  act(() => jest.runAllTimers())
  expect(global.fetch).not.toHaveBeenCalled()
})

test('the account wins: what it holds is applied here', async () => {
  signIn()
  respond({ 'library-layout': 'list', 'hidden-consoles:xbox': '["Xbox 360"]' })
  window.localStorage.setItem('library-layout', 'cards')
  renderHook(() => usePreferencesSync())
  await waitFor(() => expect(window.localStorage.getItem('library-layout')).toBe('list'))
  expect(window.localStorage.getItem('hidden-consoles:xbox')).toBe('["Xbox 360"]')
  // Applying is not a change to send back.
  act(() => jest.runAllTimers())
  expect(puts()).toEqual([])
})

test('what only this browser has goes up once; things that are not synced never do', async () => {
  signIn()
  respond({ 'library-cols': '3' })
  window.localStorage.setItem('library-layout', 'list')
  window.localStorage.setItem('library-cols', '2')
  window.localStorage.setItem('language', 'es')
  window.localStorage.setItem('main-profile-tab', 'psn')
  renderHook(() => usePreferencesSync())
  await waitFor(() => expect(puts()).toEqual([{ 'library-layout': 'list' }]))
  // The account's value for a key it has is kept.
  expect(window.localStorage.getItem('library-cols')).toBe('3')
})

test('a change is sent after a pause, and several in a row go together', async () => {
  signIn()
  respond({})
  renderHook(() => usePreferencesSync())
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
  await act(async () => {})
  userSets('library-layout', 'list')
  userSets('library-cols', '3')
  userSets('library-view', null)
  expect(puts()).toEqual([])
  await act(async () => {
    jest.advanceTimersByTime(900)
  })
  expect(puts()).toEqual([{ 'library-layout': 'list', 'library-cols': '3', 'library-view': null }])
})

test('a key that is not synced is never sent', async () => {
  signIn()
  respond({})
  renderHook(() => usePreferencesSync())
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
  await act(async () => {})
  userSets('language', 'es')
  await act(async () => {
    jest.advanceTimersByTime(900)
  })
  expect(puts()).toEqual([])
})

test('a change that cannot be saved says so, and stays in this browser', async () => {
  signIn()
  respond({}, false)
  renderHook(() => usePreferencesSync())
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
  await act(async () => {})
  userSets('library-layout', 'list')
  await act(async () => {
    jest.advanceTimersByTime(900)
  })
  expect(notify.error).toHaveBeenCalledWith(en.toast.prefsSyncFailed)
  expect(window.localStorage.getItem('library-layout')).toBe('list')
})

test('when the account cannot be read, the browser keeps what it has, quietly', async () => {
  signIn()
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
  window.localStorage.setItem('library-layout', 'list')
  renderHook(() => usePreferencesSync())
  await waitFor(() => expect(console.error).toHaveBeenCalled())
  expect(window.localStorage.getItem('library-layout')).toBe('list')
  expect(notify.error).not.toHaveBeenCalled()
})

test('leaving with a change still waiting sends it', async () => {
  signIn()
  respond({})
  const { unmount } = renderHook(() => usePreferencesSync())
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
  await act(async () => {})
  userSets('library-layout', 'cards')
  unmount()
  await waitFor(() => expect(puts()).toEqual([{ 'library-layout': 'cards' }]))
})

test('a value applied from the account updates what shows it, without being sent back', () => {
  applyStoredValue('library-layout', 'list')
  expect(window.localStorage.getItem('library-layout')).toBe('list')
})
