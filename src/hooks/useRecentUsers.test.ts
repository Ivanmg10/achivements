import { act, renderHook } from '@testing-library/react'
import { useRecentUsers } from './useRecentUsers'
import { forgetUnsavedValues } from '@/hooks/useStorageValue'

beforeEach(() => {
  localStorage.clear()
  forgetUnsavedValues()
})

test('remembers the profiles opened, newest first, each once, five at most', () => {
  const { result } = renderHook(() => useRecentUsers())
  expect(result.current.recent).toEqual([])
  for (const name of ['a', 'b', 'c', 'd', 'e', 'f']) act(() => result.current.remember({ username: name, avatar: null }))
  expect(result.current.recent.map((u) => u.username)).toEqual(['f', 'e', 'd', 'c', 'b'])
  act(() => result.current.remember({ username: 'C', avatar: 'x' }))
  expect(result.current.recent.map((u) => u.username)).toEqual(['C', 'f', 'e', 'd', 'b'])
})

test('clears them', () => {
  const { result } = renderHook(() => useRecentUsers())
  act(() => result.current.remember({ username: 'a', avatar: null }))
  act(() => result.current.clear())
  expect(result.current.recent).toEqual([])
})

test('something unreadable in storage is no list, not a crash', () => {
  localStorage.setItem('recent-user-searches', '{not json')
  expect(renderHook(() => useRecentUsers()).result.current.recent).toEqual([])
  localStorage.setItem('recent-user-searches', '{"a":1}')
  expect(renderHook(() => useRecentUsers()).result.current.recent).toEqual([])
})
