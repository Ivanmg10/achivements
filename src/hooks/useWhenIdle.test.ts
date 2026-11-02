import { act, renderHook } from '@testing-library/react'
import { useWhenIdle } from './useWhenIdle'

afterEach(() => {
  jest.useRealTimers()
  delete (window as { requestIdleCallback?: unknown }).requestIdleCallback
  delete (window as { cancelIdleCallback?: unknown }).cancelIdleCallback
})

test('false on the first paint, true once the browser is idle', () => {
  let run: () => void = () => {}
  window.requestIdleCallback = jest.fn((cb: IdleRequestCallback) => {
    run = () => cb({ didTimeout: false, timeRemaining: () => 10 })
    return 1
  })
  window.cancelIdleCallback = jest.fn()
  const { result, unmount } = renderHook(() => useWhenIdle())
  expect(result.current).toBe(false)
  expect(window.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 2000 })
  act(() => run())
  expect(result.current).toBe(true)
  unmount()
  expect(window.cancelIdleCallback).toHaveBeenCalledWith(1)
})

test('without an idle callback (Safari) it waits a moment instead', () => {
  jest.useFakeTimers()
  const { result } = renderHook(() => useWhenIdle())
  expect(result.current).toBe(false)
  act(() => jest.advanceTimersByTime(1000))
  expect(result.current).toBe(true)
})
