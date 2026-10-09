import { renderHook, waitFor, act } from '@testing-library/react'
import { useCheevoUser } from './useCheevoUser'

const USER = { username: 'ivan', avatar: null, description: null, location: null, ra: 'IvanRA', steam: false, psn: true }
const answer = (status: number, body: unknown = USER) =>
  (global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json: () => Promise.resolve(body) }))

test('loads the user by name', async () => {
  answer(200)
  const { result } = renderHook(() => useCheevoUser('ivan'))
  await waitFor(() => expect(result.current.user).toEqual(USER))
  expect(global.fetch).toHaveBeenCalledWith('/api/users/ivan')
  expect(result.current.error).toBeNull()
})

test('a 404 is "missing"', async () => {
  answer(404)
  const { result } = renderHook(() => useCheevoUser('nobody'))
  await waitFor(() => expect(result.current.error).toBe('missing'))
  expect(result.current.user).toBeNull()
})

test('a failure is "failed", and retry asks again', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  answer(500)
  const { result } = renderHook(() => useCheevoUser('ivan'))
  await waitFor(() => expect(result.current.error).toBe('failed'))

  answer(200)
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.user).toEqual(USER))
  expect(result.current.error).toBeNull()
})
