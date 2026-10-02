import { renderHook, waitFor } from '@testing-library/react'
import { usePublicGameProgression } from './usePublicGameProgression'

const respond = (ok: boolean, body: unknown) =>
  (global.fetch as jest.Mock).mockResolvedValue({ ok, status: ok ? 200 : 502, json: () => Promise.resolve(body) })

beforeEach(() => {
  global.fetch = jest.fn()
})

test('does nothing until there is a user and a game', () => {
  renderHook(() => usePublicGameProgression('', 1))
  renderHook(() => usePublicGameProgression('Ivan', null))
  expect(global.fetch).not.toHaveBeenCalled()
})

test('loads the game for that user, escaping the name', async () => {
  respond(true, { ID: 42, Title: 'Zelda' })
  const { result } = renderHook(() => usePublicGameProgression('Iv an', 42))
  await waitFor(() => expect(result.current.game).toEqual({ ID: 42, Title: 'Zelda' }))
  expect(global.fetch).toHaveBeenCalledWith('/api/public/user/gameProgression?u=Iv%20an&gameId=42')
  expect(result.current.error).toBe(false)
})

test('an answer without a game is no game, not an error', async () => {
  respond(true, {})
  const { result } = renderHook(() => usePublicGameProgression('Ivan', 42))
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.game).toBeNull()
  expect(result.current.error).toBe(false)
})

test('a failed request says so', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  respond(false, null)
  const { result } = renderHook(() => usePublicGameProgression('Ivan', 42))
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.game).toBeNull()
  expect(result.current.isLoading).toBe(false)
})
