import { renderHook, waitFor, act } from '@testing-library/react'
import { useLandingSample } from './useLandingSample'
import * as library from '@/components/landing-page/sample-library/landingLibrary'

afterEach(() => jest.restoreAllMocks())

test('nothing open: nothing to load', () => {
  const { result } = renderHook(() => useLandingSample(null, library.loadSampleAchievements))
  expect(result.current).toMatchObject({ list: [], isLoading: false, error: false })
})

test('a Steam game opened: loading, then its achievements', async () => {
  const { result } = renderHook(() => useLandingSample(202970, library.loadSampleAchievements))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.list).toHaveLength(35)
  expect(result.current.error).toBe(false)
})

test('the PSN game opened: its trophies', async () => {
  const { result } = renderHook(() => useLandingSample('NPWR11436_00', library.loadSampleTrophies))
  await waitFor(() => expect(result.current.list).toHaveLength(51))
})

test('a failed load says so, and asking again reads it', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const load = jest.fn(library.loadSampleAchievements).mockRejectedValueOnce(new Error('chunk'))
  const { result } = renderHook(() => useLandingSample(202970, load))
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.list).toHaveLength(35))
  expect(load).toHaveBeenCalledTimes(2)
})
