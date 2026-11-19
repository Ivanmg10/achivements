import { act, renderHook } from '@testing-library/react'
import { useSecondsLeft } from './useSecondsLeft'

beforeEach(() => jest.useFakeTimers({ now: 1_000_000 }))
afterEach(() => jest.useRealTimers())

test('counts down once a second and stops at 0', () => {
  const { result } = renderHook(() => useSecondsLeft(1_000_000 + 2_500))
  expect(result.current).toBe(3)
  act(() => jest.advanceTimersByTime(1000))
  expect(result.current).toBe(2)
  act(() => jest.advanceTimersByTime(3000))
  expect(result.current).toBe(0)
})

test('nothing ahead: 0, and no timer', () => {
  expect(renderHook(() => useSecondsLeft(null)).result.current).toBe(0)
  expect(renderHook(() => useSecondsLeft(999_000)).result.current).toBe(0)
  expect(jest.getTimerCount()).toBe(0)
})
