import { act, renderHook, waitFor } from '@testing-library/react'
import { useFollowing } from './useFollowing'

const USERS = [{ username: 'ivan', avatar: null, ra: true, steam: false, psn: false }]

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('loads who you follow', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(USERS) })
  const { result } = renderHook(() => useFollowing())
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.users).toEqual(USERS)
  expect(global.fetch).toHaveBeenCalledWith('/api/follows')
})

test('a failure, or an odd answer, is an error; retry asks again', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 })
  const { result } = renderHook(() => useFollowing())
  await waitFor(() => expect(result.current.error).toBe(true))

  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
  act(() => result.current.retry())
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.error).toBe(true)

  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(USERS) })
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.users).toEqual(USERS))
  expect(result.current.error).toBe(false)
})
