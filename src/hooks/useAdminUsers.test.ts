import { act, renderHook, waitFor } from '@testing-library/react'
import { useAdminUsers } from './useAdminUsers'
import { ADMIN_LOCKED_EVENT } from '@/utils/adminFetch'
import { notify } from '@/lib/notify'

jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))

const USERS = [
  { id: 1, username: 'boss', admin: true },
  { id: 2, username: 'bob', admin: false },
]
const answer = (status: number, data: unknown) => ({ ok: status < 400, status, json: () => Promise.resolve(data), clone: () => ({ json: () => Promise.resolve(data) }) })

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue(answer(200, USERS))
})

test('loads the users once', async () => {
  const { result } = renderHook(() => useAdminUsers(1))
  expect(result.current.loading).toBe(true)
  await waitFor(() => expect(result.current.users).toHaveLength(2))
  expect(result.current.loading).toBe(false)
  expect(result.current.locked).toBe(false)
})

test('a locked panel is told by the first answer, and unlocking loads them', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(answer(403, { error: 'reauth-required' }))
  const { result } = renderHook(() => useAdminUsers(1))
  await waitFor(() => expect(result.current.locked).toBe(true))
  expect(result.current.users).toEqual([])
  act(() => result.current.unlocked())
  await waitFor(() => expect(result.current.users).toHaveLength(2))
  expect(result.current.locked).toBe(false)
})

test('any admin call that finds the unlock expired sends it back to the door', async () => {
  const { result } = renderHook(() => useAdminUsers(1))
  await waitFor(() => expect(result.current.users).toHaveLength(2))
  act(() => {
    window.dispatchEvent(new Event(ADMIN_LOCKED_EVENT))
  })
  expect(result.current.locked).toBe(true)
  expect(result.current.users).toEqual([])
})

test('a failed load is an error that reload asks again', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(answer(500, {}))
  const { result } = renderHook(() => useAdminUsers(1))
  await waitFor(() => expect(result.current.error).toBe('Failed to load users'))
  act(() => result.current.reload())
  await waitFor(() => expect(result.current.users).toHaveLength(2))
  expect(result.current.error).toBeNull()
})

test('grants admin and says so; never to oneself; a refusal is a toast', async () => {
  const { result } = renderHook(() => useAdminUsers(1))
  await waitFor(() => expect(result.current.users).toHaveLength(2))

  await act(() => result.current.toggleAdmin(result.current.users[0] as never))
  expect(global.fetch).toHaveBeenCalledTimes(1)

  await act(() => result.current.toggleAdmin(result.current.users[1] as never))
  expect(result.current.users.find((u) => u.id === 2)?.admin).toBe(true)
  expect(notify.success).toHaveBeenCalledWith('bob is now an admin')

  ;(global.fetch as jest.Mock).mockResolvedValueOnce(answer(500, {}))
  await act(() => result.current.toggleAdmin(result.current.users[1] as never))
  expect(notify.error).toHaveBeenCalledWith("Could not change bob's role")
})

test('deleting resolves to null and drops the user, or to why it failed', async () => {
  const { result } = renderHook(() => useAdminUsers(1))
  await waitFor(() => expect(result.current.users).toHaveLength(2))
  const bob = result.current.users[1]

  ;(global.fetch as jest.Mock).mockResolvedValueOnce(answer(400, { error: 'Nope' }))
  let outcome: string | null = null
  await act(async () => {
    outcome = await result.current.remove(bob)
  })
  expect(outcome).toBe('Nope')
  expect(result.current.users).toHaveLength(2)

  await act(async () => {
    outcome = await result.current.remove(bob)
  })
  expect(outcome).toBeNull()
  expect(result.current.users).toHaveLength(1)
})
