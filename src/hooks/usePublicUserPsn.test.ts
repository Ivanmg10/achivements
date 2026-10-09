import { renderHook, waitFor } from '@testing-library/react'
import { usePublicUserPsn } from './usePublicUserPsn'

const answer = (status: number, body: unknown = {}) =>
  (global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json: () => Promise.resolve(body) }))

test('loads the summary for that user', async () => {
  answer(200, { onlineId: 'BobPS' })
  const { result } = renderHook(() => usePublicUserPsn('Bob'))
  await waitFor(() => expect(result.current.summary).toEqual({ onlineId: 'BobPS' }))
  expect(global.fetch).toHaveBeenCalledWith('/api/public/user/psn?u=Bob')
})

test.each([404, 403])('a %i leaves no summary, quietly', async (status) => {
  answer(status)
  const { result } = renderHook(() => usePublicUserPsn('Bob'))
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  expect(result.current.summary).toBeNull()
})

test('a failure is logged and leaves no summary', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {})
  answer(502)
  const { result } = renderHook(() => usePublicUserPsn('Bob'))
  await waitFor(() => expect(log).toHaveBeenCalled())
  expect(result.current.summary).toBeNull()
})
