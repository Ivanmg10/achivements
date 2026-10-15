import { act, renderHook, waitFor } from '@testing-library/react'
import { useHashTab } from './useHashTab'

const TABS = ['overview', 'games'] as const

afterEach(() => {
  window.location.hash = ''
})

test('the first tab when the hash names none', async () => {
  window.location.hash = '#nope'
  const { result } = renderHook(() => useHashTab(TABS))
  await waitFor(() => expect(result.current[0]).toBe('overview'))
})

test('opens the tab the hash names, and follows it changing', async () => {
  window.location.hash = '#games'
  const { result } = renderHook(() => useHashTab(TABS))
  expect(result.current[0]).toBe('games')
  act(() => result.current[1]('overview'))
  expect(window.location.hash).toBe('#overview')
  await waitFor(() => expect(result.current[0]).toBe('overview'))
})
