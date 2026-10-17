import { renderHook, waitFor, act } from '@testing-library/react'
import { usePsnCollectionTrophies } from './usePsnCollectionTrophies'

const answer = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body })

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn((url: string) =>
    Promise.resolve(answer({ trophies: [{ id: url.includes('NPWR11435') ? 35 : 36 }], groups: [{ id: 'default' }] })),
  ) as jest.Mock
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => (console.error as jest.Mock).mockRestore())

test('loads nothing without games', () => {
  const { result } = renderHook(() => usePsnCollectionTrophies([]))
  expect(result.current).toMatchObject({ byGame: {}, isLoading: false, error: null })
  expect(global.fetch).not.toHaveBeenCalled()
})

test("loads every game's trophies, by trophy set, loading from the first render", async () => {
  const { result } = renderHook(() => usePsnCollectionTrophies(['NPWR11436_00', 'NPWR11435_00']))
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.byGame).toEqual({
    NPWR11436_00: { trophies: [{ id: 36 }], groups: [{ id: 'default' }] },
    NPWR11435_00: { trophies: [{ id: 35 }], groups: [{ id: 'default' }] },
  })
  expect(global.fetch).toHaveBeenCalledWith('/api/psn/trophies?id=NPWR11435_00&lang=en')
})

test('one game failing fails the whole with its reason, and retry asks again', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce(answer({ error: 'private' }, false, 403))
  const { result } = renderHook(() => usePsnCollectionTrophies(['NPWR11436_00', 'NPWR11435_00']))
  await waitFor(() => expect(result.current.error).toBe('private'))
  expect(result.current.byGame).toEqual({})
  act(() => result.current.retry())
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.error).toBeNull()
  expect(Object.keys(result.current.byGame)).toHaveLength(2)
})

test('an odd answer is "failed"', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue(answer({ nope: true }))
  const { result } = renderHook(() => usePsnCollectionTrophies(['NPWR11436_00']))
  await waitFor(() => expect(result.current.error).toBe('failed'))
})
