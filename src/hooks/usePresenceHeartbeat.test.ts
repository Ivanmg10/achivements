import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { usePresenceHeartbeat, HEARTBEAT_MS } from './usePresenceHeartbeat'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))

let visibility: DocumentVisibilityState = 'visible'
Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
const setVisibility = (v: DocumentVisibilityState) => {
  visibility = v
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  jest.useFakeTimers()
  visibility = 'visible'
  global.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
})

afterEach(() => jest.useRealTimers())

test('beats on arrival and every interval while the tab is visible', () => {
  renderHook(() => usePresenceHeartbeat())
  expect(global.fetch).toHaveBeenCalledWith('/api/presence', { method: 'POST' })
  jest.advanceTimersByTime(HEARTBEAT_MS * 2)
  expect(global.fetch).toHaveBeenCalledTimes(3)
})

test('a hidden tab does not beat; coming back to it does, at once', () => {
  renderHook(() => usePresenceHeartbeat())
  setVisibility('hidden')
  jest.advanceTimersByTime(HEARTBEAT_MS * 3)
  expect(global.fetch).toHaveBeenCalledTimes(1)
  setVisibility('visible')
  expect(global.fetch).toHaveBeenCalledTimes(2)
})

test('signed out, nothing is sent; unmounted, it stops', () => {
  ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated' })
  const { rerender, unmount } = renderHook(() => usePresenceHeartbeat())
  expect(global.fetch).not.toHaveBeenCalled()
  ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated' })
  rerender()
  expect(global.fetch).toHaveBeenCalledTimes(1)
  unmount()
  jest.advanceTimersByTime(HEARTBEAT_MS * 3)
  expect(global.fetch).toHaveBeenCalledTimes(1)
})

test('a failed beat is logged, not thrown', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch
  renderHook(() => usePresenceHeartbeat())
  await Promise.resolve()
  await Promise.resolve()
  expect(spy).toHaveBeenCalledWith('[usePresenceHeartbeat]', 500)
})
