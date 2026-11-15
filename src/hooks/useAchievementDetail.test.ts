import { renderHook, waitFor } from '@testing-library/react'
import { useAchievementDetail } from './useAchievementDetail'

const DETAIL = { unlocks: null, comments: { Count: 1, Total: 1, Results: [] } }

test('reads the detail of the achievement, loading until it arrives', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(DETAIL) })
  const { result } = renderHook(() => useAchievementDetail(7))
  expect(result.current.loading).toBe(true)
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.detail).toEqual(DETAIL)
  expect(result.current.error).toBe(false)
  expect(global.fetch).toHaveBeenCalledWith('/api/getAchievementDetail?achievementId=7')
})

test('a refused or failed read is an error, not a status code', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })
  const { result } = renderHook(() => useAchievementDetail(7))
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.loading).toBe(false)
  expect(result.current.detail).toBeNull()
})

test('another achievement starts loading again, and a late answer for the old one does not land', async () => {
  let release: (v: unknown) => void = () => {}
  global.fetch = jest
    .fn()
    .mockImplementationOnce(() => new Promise((resolve) => (release = resolve)))
    .mockResolvedValue({ ok: true, json: () => Promise.resolve({ ...DETAIL, comments: { Count: 2, Total: 2, Results: [] } }) })
  const { result, rerender } = renderHook(({ id }) => useAchievementDetail(id), { initialProps: { id: 7 } })
  rerender({ id: 8 })
  await waitFor(() => expect(result.current.detail?.comments?.Total).toBe(2))
  release({ ok: true, json: () => Promise.resolve(DETAIL) })
  await Promise.resolve()
  expect(result.current.detail?.comments?.Total).toBe(2)
})
