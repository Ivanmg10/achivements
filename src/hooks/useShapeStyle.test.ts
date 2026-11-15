import { act, renderHook } from '@testing-library/react'
import { useShapeStyle } from './useShapeStyle'
import { isSyncedKey } from '@/utils/syncedPreferences'

beforeEach(() => localStorage.clear())

test('slanted by default, and the choice is kept', () => {
  const { result } = renderHook(() => useShapeStyle())
  expect(result.current[0]).toBe('slanted')
  act(() => result.current[1]('round'))
  expect(result.current[0]).toBe('round')
  expect(localStorage.getItem('shape-style')).toContain('round')
})

test('it follows the account', () => {
  expect(isSyncedKey('shape-style')).toBe(true)
})
