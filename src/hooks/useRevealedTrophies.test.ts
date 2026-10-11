import { renderHook, act } from '@testing-library/react'
import { useRevealedTrophies } from './useRevealedTrophies'

beforeEach(() => window.localStorage.clear())

test('starts concealed; an eye flips one trophy; setAll shows or hides the lot', () => {
  const { result } = renderHook(() => useRevealedTrophies())
  expect(result.current.isRevealed(1)).toBe(false)
  act(() => result.current.toggle(1))
  expect(result.current.isRevealed(1)).toBe(true)
  expect(result.current.isRevealed(2)).toBe(false)
  act(() => result.current.setAll([1, 2], true))
  expect([1, 2].map(result.current.isRevealed)).toEqual([true, true])
  act(() => result.current.setAll([1, 2], false))
  expect([1, 2].map(result.current.isRevealed)).toEqual([false, false])
})

test('with the preference on, trophies start revealed and an eye hides one', () => {
  window.localStorage.setItem('psn-hidden-trophies', 'reveal')
  const { result } = renderHook(() => useRevealedTrophies())
  expect(result.current.isRevealed(1)).toBe(true)
  act(() => result.current.toggle(1))
  expect(result.current.isRevealed(1)).toBe(false)
})
