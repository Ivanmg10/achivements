jest.mock('@/utils/adminFetch', () => ({ adminFetch: jest.fn() }))

import { act, renderHook, waitFor } from '@testing-library/react'
import { adminFetch } from '@/utils/adminFetch'
import { useAdminPsnAccounts } from './useAdminPsnAccounts'
import { psnAccount, psnStatus } from '@/test-utils/psnPoolFixtures'

const fetchMock = adminFetch as jest.Mock
const answer = (status: number, body: unknown) => ({ ok: status < 300, status, json: async () => body })
const STATUS = psnStatus([psnAccount()])

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  fetchMock.mockResolvedValue(answer(200, STATUS))
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('reads the accounts and the pool when it mounts, and when they were read', async () => {
  const { result } = renderHook(() => useAdminPsnAccounts())
  await waitFor(() => expect(result.current.status).toEqual(STATUS))
  expect(result.current.loadedAt).toBeGreaterThan(0)
  expect(fetchMock).toHaveBeenCalledWith('/api/admin/psn/accounts')
})

test('a failed read says so, and retry asks again', async () => {
  fetchMock.mockResolvedValueOnce(answer(500, {}))
  const { result } = renderHook(() => useAdminPsnAccounts())
  await waitFor(() => expect(result.current.loadError).toBe(true))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.loadError).toBe(false))
})

test('each action calls its route, and a success reads the list again', async () => {
  const { result } = renderHook(() => useAdminPsnAccounts())
  await waitFor(() => expect(result.current.status).not.toBeNull())
  fetchMock.mockClear()
  fetchMock.mockResolvedValueOnce(answer(201, { id: 2, onlineId: 'Two', expiresAt: 'x' })).mockResolvedValue(answer(200, STATUS))
  let added
  await act(async () => {
    added = await result.current.add({ label: 'PSN-2', hint: '', weight: 1, npsso: 'n' })
  })
  expect(added).toEqual({ ok: true, data: { id: 2, onlineId: 'Two', expiresAt: 'x' } })
  expect(fetchMock.mock.calls[0]).toEqual(['/api/admin/psn/accounts', expect.objectContaining({ method: 'POST' })])
  expect(fetchMock).toHaveBeenCalledWith('/api/admin/psn/accounts')

  await act(async () => {
    await result.current.renew(2, 'n')
    await result.current.test(2)
    await result.current.update(2, { status: 'paused' })
    await result.current.remove(2)
  })
  const calls = fetchMock.mock.calls.map((c) => `${c[1]?.method ?? 'GET'} ${c[0]}`)
  expect(calls).toEqual(expect.arrayContaining(['POST /api/admin/psn/accounts/2/rotate', 'POST /api/admin/psn/accounts/2/test', 'PATCH /api/admin/psn/accounts/2', 'DELETE /api/admin/psn/accounts/2']))
})

test("a refusal comes back as the route's code; an unknown one or no answer is failed", async () => {
  const { result } = renderHook(() => useAdminPsnAccounts())
  await waitFor(() => expect(result.current.status).not.toBeNull())
  fetchMock.mockResolvedValueOnce(answer(422, { error: 'rejected' }))
  expect(await result.current.renew(1, 'n')).toEqual({ ok: false, error: 'rejected' })
  fetchMock.mockResolvedValueOnce(answer(500, { error: 'something else' }))
  expect(await result.current.test(1)).toEqual({ ok: false, error: 'failed' })
  fetchMock.mockRejectedValueOnce(new Error('offline'))
  expect(await result.current.remove(1)).toEqual({ ok: false, error: 'failed' })
})
