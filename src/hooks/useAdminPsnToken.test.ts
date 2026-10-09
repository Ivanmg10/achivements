jest.mock('@/utils/adminFetch', () => ({ adminFetch: jest.fn() }))

import { renderHook, waitFor, act } from '@testing-library/react'
import { useAdminPsnToken } from './useAdminPsnToken'
import { adminFetch } from '@/utils/adminFetch'

const STATUS = { configured: true, stored: true, expiresAt: null, daysLeft: 12, updatedAt: null, updatedBy: null }
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body })

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('loads the status once', async () => {
  ;(adminFetch as jest.Mock).mockResolvedValue(ok(STATUS))
  const { result, rerender } = renderHook(() => useAdminPsnToken())
  await waitFor(() => expect(result.current.status).toEqual(STATUS))
  rerender()
  expect(adminFetch).toHaveBeenCalledTimes(1)
})

test('a failed load is reported', async () => {
  ;(adminFetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
  const { result } = renderHook(() => useAdminPsnToken())
  await waitFor(() => expect(result.current.loadError).toBe(true))
})

test('saving sends the NPSSO and reloads the status', async () => {
  ;(adminFetch as jest.Mock).mockResolvedValue(ok(STATUS))
  const { result } = renderHook(() => useAdminPsnToken())
  await waitFor(() => expect(result.current.status).not.toBeNull())
  let saved = false
  await act(async () => {
    saved = await result.current.save('n')
  })
  expect(saved).toBe(true)
  expect(adminFetch).toHaveBeenCalledWith('/api/admin/psn', expect.objectContaining({ method: 'PUT', body: '{"npsso":"n"}' }))
})

test('a refused NPSSO keeps the reason', async () => {
  ;(adminFetch as jest.Mock)
    .mockResolvedValueOnce(ok(STATUS))
    .mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({ error: 'rejected' }) })
  const { result } = renderHook(() => useAdminPsnToken())
  await waitFor(() => expect(result.current.status).not.toBeNull())
  await act(async () => {
    expect(await result.current.save('n')).toBe(false)
  })
  expect(result.current.saveError).toBe('rejected')
})
