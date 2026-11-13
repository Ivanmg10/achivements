import { renderHook, waitFor, act } from '@testing-library/react'
import { useLandingSampleAchievements } from './useLandingSampleAchievements'
import * as library from '@/components/landing-page/sample-library/landingLibrary'

afterEach(() => jest.restoreAllMocks())

test('nothing open: nothing to load', () => {
  const { result } = renderHook(() => useLandingSampleAchievements(null))
  expect(result.current).toMatchObject({ achievements: [], isLoading: false, error: false })
})

test('a game opened: loading, then its achievements', async () => {
  const { result } = renderHook(() => useLandingSampleAchievements(202970))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.achievements).toHaveLength(35)
  expect(result.current.error).toBe(false)
})

test('a failed load says so, and asking again reads it', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const spy = jest.spyOn(library, 'loadSampleAchievements').mockRejectedValueOnce(new Error('chunk'))
  const { result } = renderHook(() => useLandingSampleAchievements(202970))
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.achievements).toHaveLength(35))
  expect(spy).toHaveBeenCalledTimes(2)
})
