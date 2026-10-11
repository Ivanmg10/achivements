import { renderHook, act } from '@testing-library/react'
import { usePsnPlatinumCompletes } from './usePsnPlatinumCompletes'

beforeEach(() => window.localStorage.clear())

test('off by default, and remembers the choice', () => {
  const { result } = renderHook(() => usePsnPlatinumCompletes())
  expect(result.current[0]).toBe(false)
  act(() => result.current[1](true))
  expect(result.current[0]).toBe(true)
  expect(window.localStorage.getItem('psn-completion')).toBe('platinum')
  act(() => result.current[1](false))
  expect(result.current[0]).toBe(false)
})
