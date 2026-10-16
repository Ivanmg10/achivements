import { renderHook, act } from '@testing-library/react'
import { useHiddenConsoles } from './useHiddenConsoles'

beforeEach(() => window.localStorage.clear())

test('nothing hidden by default', () => {
  const { result } = renderHook(() => useHiddenConsoles('xbox'))
  expect(result.current.hidden.size).toBe(0)
})

test('toggling hides and shows a console, remembered per platform', () => {
  const { result } = renderHook(() => useHiddenConsoles('xbox'))
  act(() => result.current.toggle('Xbox 360'))
  expect([...result.current.hidden]).toEqual(['Xbox 360'])
  expect(window.localStorage.getItem('hidden-consoles:xbox')).toBe('["Xbox 360"]')
  expect(renderHook(() => useHiddenConsoles('psn')).result.current.hidden.size).toBe(0)
  act(() => result.current.toggle('Xbox 360'))
  expect(result.current.hidden.size).toBe(0)
  expect(window.localStorage.getItem('hidden-consoles:xbox')).toBeNull()
})

test('hideOnly sets the list, showAll clears it', () => {
  const { result } = renderHook(() => useHiddenConsoles('ra'))
  act(() => result.current.hideOnly(['SNES', 'NES']))
  expect(result.current.hidden.size).toBe(2)
  act(() => result.current.showAll())
  expect(result.current.hidden.size).toBe(0)
})

test('a broken saved value shows everything', () => {
  window.localStorage.setItem('hidden-consoles:ra', '{not json')
  expect(renderHook(() => useHiddenConsoles('ra')).result.current.hidden.size).toBe(0)
  window.localStorage.setItem('hidden-consoles:ra', '{"a":1}')
  expect(renderHook(() => useHiddenConsoles('ra')).result.current.hidden.size).toBe(0)
  window.localStorage.setItem('hidden-consoles:ra', '["SNES",3]')
  expect([...renderHook(() => useHiddenConsoles('ra')).result.current.hidden]).toEqual(['SNES'])
})
