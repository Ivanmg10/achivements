import { act, renderHook } from '@testing-library/react'
import { useFontStyle } from './useFontStyle'
import { isSyncedKey } from '@/utils/syncedPreferences'

beforeEach(() => localStorage.clear())

test('Barlow by default, and the choice is kept', () => {
  const { result } = renderHook(() => useFontStyle())
  expect(result.current[0]).toBe('barlow')
  act(() => result.current[1]('sofia'))
  expect(result.current[0]).toBe('sofia')
  expect(localStorage.getItem('font-style')).toContain('sofia')
})

test('a value nobody offers falls back to the default', () => {
  localStorage.setItem('font-style', 'comic')
  const { result } = renderHook(() => useFontStyle())
  expect(result.current[0]).toBe('barlow')
})

test('it follows the account', () => {
  expect(isSyncedKey('font-style')).toBe(true)
})
