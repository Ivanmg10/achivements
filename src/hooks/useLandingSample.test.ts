import { renderHook, waitFor, act } from '@testing-library/react'
import { useLandingSample } from './useLandingSample'
import * as library from '@/components/landing-page/sample-library/landingLibrary'

afterEach(() => jest.restoreAllMocks())

test('nothing open: nothing to load', () => {
  const { result } = renderHook(() => useLandingSample(null, library.loadSampleAchievements))
  expect(result.current).toMatchObject({ data: null, isLoading: false, error: false })
})

test('a Steam game opened: loading, then its achievements', async () => {
  const { result } = renderHook(() => useLandingSample(202970, library.loadSampleAchievements))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.data).toHaveLength(35)
  expect(result.current.error).toBe(false)
})

test('the PSN game opened: its trophies', async () => {
  const { result } = renderHook(() => useLandingSample('NPWR11436_00', library.loadSampleTrophies))
  await waitFor(() => expect(result.current.data).toHaveLength(51))
})

test('an RA game opened: its players and achievements', async () => {
  const { result } = renderHook(() => useLandingSample(576, library.loadSampleRaGame))
  await waitFor(() => expect(result.current.data?.achievements).toHaveLength(72))
  expect(result.current.data?.players).toBeGreaterThan(0)
})

test('a failed load says so, and asking again reads it', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const load = jest.fn(library.loadSampleAchievements).mockRejectedValueOnce(new Error('chunk'))
  const { result } = renderHook(() => useLandingSample(202970, load))
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.data).toHaveLength(35))
  expect(load).toHaveBeenCalledTimes(2)
})
