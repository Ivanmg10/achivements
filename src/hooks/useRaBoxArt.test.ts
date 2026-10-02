import { renderHook, waitFor } from '@testing-library/react'
import { useRaBoxArt } from './useRaBoxArt'

const fetchMock = jest.fn()
beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

function ok(body: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) })
}

test('asks for each game and maps its box art by id', async () => {
  fetchMock.mockImplementation((url: string) =>
    ok({ ImageBoxArt: url.endsWith('=1') ? '/Images/box1.png' : '/Images/box2.png' }),
  )
  const { result } = renderHook(() => useRaBoxArt([1, 2]))
  await waitFor(() => expect(result.current[2]).toBeDefined())
  expect(result.current).toEqual({
    1: 'https://retroachievements.org/Images/box1.png',
    2: 'https://retroachievements.org/Images/box2.png',
  })
  expect(fetchMock).toHaveBeenCalledWith('/api/getGameData?gameId=1', expect.anything())
})

test('a game whose lookup fails has no art; the others still do', async () => {
  fetchMock.mockImplementation((url: string) =>
    url.endsWith('=1') ? Promise.resolve({ ok: false, status: 404 }) : ok({ ImageBoxArt: '/Images/box2.png' }),
  )
  const { result } = renderHook(() => useRaBoxArt([1, 2]))
  await waitFor(() => expect(result.current[2]).toBeDefined())
  expect(result.current[1]).toBeUndefined()
  expect(console.error).toHaveBeenCalled()
})

test('a network error is caught, not thrown', async () => {
  fetchMock.mockRejectedValue(new Error('offline'))
  const { result } = renderHook(() => useRaBoxArt([7]))
  await waitFor(() => expect(console.error).toHaveBeenCalled())
  expect(result.current[7]).toBeUndefined()
})

test('asks nothing with no games', () => {
  renderHook(() => useRaBoxArt([]))
  expect(fetchMock).not.toHaveBeenCalled()
})

test('a passing 503 is asked again, so one throttled answer does not cost the art', async () => {
  let calls = 0
  fetchMock.mockImplementation(() => (++calls === 1 ? Promise.resolve({ ok: false, status: 503 }) : ok({ ImageBoxArt: '/Images/box9.png' })))
  const { result } = renderHook(() => useRaBoxArt([9]))
  await waitFor(() => expect(result.current[9]).toBe('https://retroachievements.org/Images/box9.png'), { timeout: 4000 })
  expect(calls).toBeGreaterThanOrEqual(2)
})
