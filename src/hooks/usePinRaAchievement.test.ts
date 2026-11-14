import { renderHook, act } from '@testing-library/react'
import { usePinRaAchievement } from './usePinRaAchievement'
import type { RetroAchievement } from '@/types/types'

const ach = { ID: 5, Title: 'A' } as RetroAchievement
const game = { gameId: 1, gameTitle: 'G', numDistinctPlayers: 9 }

test('posts the achievement with its game and says it worked', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
  const { result } = renderHook(() => usePinRaAchievement(game))
  let ok = false
  await act(async () => { ok = await result.current.pin(ach) })
  expect(ok).toBe(true)
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
  expect(url).toBe('/api/favorites')
  expect(JSON.parse(init.body)).toEqual({ achievement: ach, ...game })
  expect(result.current.error).toBe(false)
})

test('a refusal and a network failure both set the error and free the row', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 500 }).mockRejectedValueOnce(new Error('offline'))
  const { result } = renderHook(() => usePinRaAchievement(game))
  await act(async () => { await result.current.pin(ach) })
  expect(result.current.error).toBe(true)
  expect(result.current.pinningId).toBeNull()
  await act(async () => { await result.current.pin(ach) })
  expect(result.current.error).toBe(true)
  act(() => result.current.reset())
  expect(result.current.error).toBe(false)
})
