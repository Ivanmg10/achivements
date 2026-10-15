import { act, renderHook } from '@testing-library/react'
import { useFollow } from './useFollow'
import { notify } from '@/lib/notify'
import { en } from '@/translations/en'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
})

test('follows at once, then says so', async () => {
  const { result } = renderHook(() => useFollow('ivan', false))
  await act(() => result.current.toggle())
  expect(result.current.following).toBe(true)
  expect(global.fetch).toHaveBeenCalledWith('/api/follows', expect.objectContaining({ method: 'POST', body: JSON.stringify({ username: 'ivan' }) }))
  expect(notify.success).toHaveBeenCalledWith(en.toast.followed.replace('{u}', 'ivan'))
})

test('unfollows by name', async () => {
  const { result } = renderHook(() => useFollow('a b', true))
  await act(() => result.current.toggle())
  expect(result.current.following).toBe(false)
  expect(global.fetch).toHaveBeenCalledWith('/api/follows?username=a%20b', { method: 'DELETE' })
  expect(notify.success).toHaveBeenCalledWith(en.toast.unfollowed.replace('{u}', 'a b'))
})

test('a refusal puts it back and says so', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 })
  const { result } = renderHook(() => useFollow('ivan', false))
  await act(() => result.current.toggle())
  expect(result.current.following).toBe(false)
  expect(result.current.pending).toBe(false)
  expect(notify.error).toHaveBeenCalledWith(en.toast.followFailed)
})

test('another user starts from what the server says', () => {
  const { result, rerender } = renderHook(({ name, initial }) => useFollow(name, initial), { initialProps: { name: 'a', initial: false } })
  rerender({ name: 'b', initial: true })
  expect(result.current.following).toBe(true)
})
