import { renderHook, act } from '@testing-library/react'
import { usePsnRevealHidden } from './usePsnRevealHidden'

beforeEach(() => window.localStorage.clear())

test('concealed by default, and remembers the choice', () => {
  const { result } = renderHook(() => usePsnRevealHidden())
  expect(result.current[0]).toBe(false)
  act(() => result.current[1](true))
  expect(result.current[0]).toBe(true)
  expect(window.localStorage.getItem('psn-hidden-trophies')).toBe('reveal')
})
