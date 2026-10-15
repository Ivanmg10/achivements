jest.mock('@/lib/fetchWithRetry', () => ({ fetchWithRetry: jest.fn() }))

import { renderHook, waitFor } from '@testing-library/react'
import { useRaScreenshot } from './useRaScreenshot'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

const answer = (data: unknown) => (fetchWithRetry as jest.Mock).mockResolvedValue(data)

beforeEach(() => jest.clearAllMocks())

test('the title screen, as a full URL', async () => {
  answer({ ImageTitle: '/Images/t.png', ImageIngame: '/Images/g.png' })
  const { result } = renderHook(() => useRaScreenshot(5))
  expect(result.current).toBeUndefined()
  await waitFor(() => expect(result.current).toBe('https://retroachievements.org/Images/t.png'))
  expect(fetchWithRetry).toHaveBeenCalledWith('/api/getGameData?gameId=5')
})

test('a frame of play when there is no title screen', async () => {
  answer({ ImageTitle: null, ImageIngame: '/Images/g.png' })
  const { result } = renderHook(() => useRaScreenshot(5))
  await waitFor(() => expect(result.current).toBe('https://retroachievements.org/Images/g.png'))
})

test('nothing for a game with neither', async () => {
  answer({})
  const { result } = renderHook(() => useRaScreenshot(5))
  await waitFor(() => expect(fetchWithRetry).toHaveBeenCalled())
  expect(result.current).toBeUndefined()
})

test('nothing, and no call, without a game; a failed call is logged and leaves nothing', async () => {
  const none = renderHook(() => useRaScreenshot(null))
  expect(none.result.current).toBeUndefined()
  expect(fetchWithRetry).not.toHaveBeenCalled()
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  ;(fetchWithRetry as jest.Mock).mockRejectedValue(new Error('503'))
  const { result } = renderHook(() => useRaScreenshot(6))
  await waitFor(() => expect(spy).toHaveBeenCalled())
  expect(result.current).toBeUndefined()
  spy.mockRestore()
})

test('another game does not inherit the last one\'s picture', async () => {
  answer({ ImageTitle: '/Images/a.png' })
  const { result, rerender } = renderHook(({ id }) => useRaScreenshot(id), { initialProps: { id: 1 } })
  await waitFor(() => expect(result.current).toBeDefined())
  ;(fetchWithRetry as jest.Mock).mockReturnValue(new Promise(() => {}))
  rerender({ id: 2 })
  expect(result.current).toBeUndefined()
})
