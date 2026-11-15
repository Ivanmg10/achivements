import { act, renderHook, waitFor } from '@testing-library/react'
import { useAdminActionLog } from './useAdminActionLog'

const ENTRIES = [{ id: 1, admin_username: 'boss', target_username: null, action: 'unlock', detail: null, created_at: '2026-10-02T09:00:00Z' }]
const res = (ok: boolean) => ({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(ENTRIES), clone: () => ({ json: () => Promise.resolve(ENTRIES) }) })

test('reads the log once when it opens', async () => {
  global.fetch = jest.fn().mockResolvedValue(res(true))
  const { result } = renderHook(() => useAdminActionLog())
  expect(result.current.entries).toBeNull()
  await waitFor(() => expect(result.current.entries).toEqual(ENTRIES))
  expect(global.fetch).toHaveBeenCalledTimes(1)
})

test('a failed read is an error, and retry asks again', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce(res(false)).mockResolvedValue(res(true))
  const { result } = renderHook(() => useAdminActionLog())
  await waitFor(() => expect(result.current.error).toBe(true))
  act(() => result.current.retry())
  await waitFor(() => expect(result.current.entries).toEqual(ENTRIES))
  expect(result.current.error).toBe(false)
})
