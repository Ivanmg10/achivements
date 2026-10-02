import { act, renderHook } from '@testing-library/react'
import { useConsoleFilter } from './useConsoleFilter'

test('starts from the given consoles, or none', () => {
  expect([...renderHook(() => useConsoleFilter([1, 2])).result.current.selected]).toEqual([1, 2])
  expect(renderHook(() => useConsoleFilter()).result.current.selected.size).toBe(0)
})

test('toggling adds a console, toggling again removes it', () => {
  const { result } = renderHook(() => useConsoleFilter())
  act(() => result.current.toggle(7))
  expect(result.current.selected.has(7)).toBe(true)
  act(() => result.current.toggle(7))
  expect(result.current.selected.has(7)).toBe(false)
})

test('clear drops every console', () => {
  const { result } = renderHook(() => useConsoleFilter([1, 2, 3]))
  act(() => result.current.clear())
  expect(result.current.selected.size).toBe(0)
})
