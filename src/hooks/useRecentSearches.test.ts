import { act, renderHook } from '@testing-library/react'
import { useRecentSearches } from './useRecentSearches'

beforeEach(() => localStorage.clear())

test('remembers what was searched, newest first, without repeats or blanks', () => {
  const { result } = renderHook(() => useRecentSearches())
  act(() => result.current.remember('pokémon'))
  act(() => result.current.remember('platino'))
  act(() => result.current.remember('Pokémon'))
  act(() => result.current.remember('   '))
  expect(result.current.recent).toEqual(['Pokémon', 'platino'])
})

test('keeps six at most, and can be cleared', () => {
  const { result } = renderHook(() => useRecentSearches())
  for (const q of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) act(() => result.current.remember(q))
  expect(result.current.recent).toEqual(['g', 'f', 'e', 'd', 'c', 'b'])
  act(() => result.current.clear())
  expect(result.current.recent).toEqual([])
})

test('a broken value in storage is no searches, not a crash', () => {
  localStorage.setItem('search-recent', '{nope')
  const { result } = renderHook(() => useRecentSearches())
  expect(result.current.recent).toEqual([])
})
