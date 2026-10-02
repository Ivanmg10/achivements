import { renderHook, waitFor } from '@testing-library/react'
import { useGroupDetail } from './useGroupDetail'

const fetchMock = jest.fn()
beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

test('loads the group with its games', async () => {
  fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 4, title: 'Pokémon', items: [{ id: 1 }] }) })
  const { result } = renderHook(() => useGroupDetail(4))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.group?.items).toHaveLength(1)
  expect(fetchMock).toHaveBeenCalledWith('/api/groups/4')
})

test('a failed answer is an error, not an empty group', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 500 })
  const { result } = renderHook(() => useGroupDetail(4))
  await waitFor(() => expect(result.current.error).toBe(true))
  expect(result.current.group).toBeNull()
})

test('switching groups never shows the previous one', async () => {
  fetchMock.mockImplementation((url: string) =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ id: Number(url.split('/').pop()), title: url }) }),
  )
  const { result, rerender } = renderHook(({ id }) => useGroupDetail(id), { initialProps: { id: 1 } })
  await waitFor(() => expect(result.current.group?.id).toBe(1))
  rerender({ id: 2 })
  expect(result.current.group).toBeNull()
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.group?.id).toBe(2))
})

test('no group selected, nothing asked', () => {
  const { result } = renderHook(() => useGroupDetail(null))
  expect(result.current.isLoading).toBe(false)
  expect(fetchMock).not.toHaveBeenCalled()
})
