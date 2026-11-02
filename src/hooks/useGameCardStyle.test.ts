import { act, renderHook } from '@testing-library/react'
import { useGameCardStyle } from './useGameCardStyle'
import { isSyncedKey } from '@/utils/syncedPreferences'

beforeEach(() => localStorage.clear())

test('tinted by default, and the choice is kept', () => {
  const { result } = renderHook(() => useGameCardStyle())
  expect(result.current[0]).toBe('tinted')
  act(() => result.current[1]('flat'))
  expect(result.current[0]).toBe('flat')
  expect(localStorage.getItem('game-card-style')).toContain('flat')
})

test('a value nobody offers falls back to the default', () => {
  localStorage.setItem('game-card-style', 'neon')
  const { result } = renderHook(() => useGameCardStyle())
  expect(result.current[0]).toBe('tinted')
})

test('it follows the account', () => {
  expect(isSyncedKey('game-card-style')).toBe(true)
})
