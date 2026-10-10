import { act, renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useGroups } from './useGroups'

jest.mock('next-auth/react', () => ({ useSession: jest.fn() }))

const GROUP = { id: 1, title: 'Backlog' }
const answer = (body: unknown, ok = true, status = ok ? 200 : 500) => ({ ok, status, json: () => Promise.resolve(body) })
const session = (status: 'authenticated' | 'unauthenticated' | 'loading') =>
  (useSession as jest.Mock).mockReturnValue({ status, data: null })

beforeEach(() => {
  jest.clearAllMocks()
  session('authenticated')
  global.fetch = jest.fn().mockResolvedValue(answer([GROUP]))
})

test('loads the groups of the signed-in user', async () => {
  const { result } = renderHook(() => useGroups())
  expect(result.current.isLoading).toBe(true)
  await waitFor(() => expect(result.current.groups).toEqual([GROUP]))
  expect(result.current.isLoading).toBe(false)
  expect(result.current.error).toBeNull()
  expect(fetch).toHaveBeenCalledWith('/api/groups')
})

test('asks only once, however often it re-renders', async () => {
  const { result, rerender } = renderHook(() => useGroups())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  rerender()
  rerender()
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('waits for the session to be known', () => {
  session('loading')
  const { result } = renderHook(() => useGroups())
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current.isLoading).toBe(true)
})

test('signed out there is nothing to ask and nothing to wait for', () => {
  session('unauthenticated')
  const { result } = renderHook(() => useGroups())
  expect(fetch).not.toHaveBeenCalled()
  expect(result.current.isLoading).toBe(false)
  expect(result.current.groups).toEqual([])
})

test('a failed load sets the error and stops loading', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({}, false))
  const { result } = renderHook(() => useGroups())
  await waitFor(() => expect(result.current.error).toBe('Error loading groups'))
  expect(result.current.isLoading).toBe(false)
})

test('an answer that is not a list is no groups', async () => {
  ;(fetch as jest.Mock).mockResolvedValue(answer({ message: 'odd' }))
  const { result } = renderHook(() => useGroups())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.groups).toEqual([])
})

test('creating adds the group the server returns', async () => {
  const { result } = renderHook(() => useGroups())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  ;(fetch as jest.Mock).mockResolvedValue(answer({ id: 2, title: 'New' }))
  let created
  await act(async () => { created = await result.current.createGroup({ title: 'New' }) })
  expect(created).toEqual({ id: 2, title: 'New' })
  expect(result.current.groups.map((g) => g.id)).toEqual([1, 2])
  const [url, init] = (fetch as jest.Mock).mock.calls.at(-1)
  expect(url).toBe('/api/groups')
  expect(init.method).toBe('POST')
  expect(JSON.parse(init.body)).toEqual({ title: 'New' })
})

test('a refused create throws the server message and changes nothing', async () => {
  const { result } = renderHook(() => useGroups())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  ;(fetch as jest.Mock).mockResolvedValue(answer({ message: 'Title taken' }, false, 409))
  await expect(result.current.createGroup({ title: 'New' })).rejects.toThrow('Title taken')
  expect(result.current.groups).toHaveLength(1)
})

test('updating merges the answer into that group only', async () => {
  const { result } = renderHook(() => useGroups())
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  ;(fetch as jest.Mock).mockResolvedValue(answer({ id: 1, title: 'Renamed' }))
  await act(async () => { await result.current.updateGroup(1, { title: 'Renamed' }) })
  expect(result.current.groups[0].title).toBe('Renamed')
  expect((fetch as jest.Mock).mock.calls.at(-1)[0]).toBe('/api/groups/1')
})

test('deleting removes the group; a refused delete throws and keeps it', async () => {
  const { result } = renderHook(() => useGroups())
  await waitFor(() => expect(result.current.isLoading).toBe(false))

  ;(fetch as jest.Mock).mockResolvedValue(answer({}, false))
  await expect(result.current.deleteGroup(1)).rejects.toThrow('Error deleting group')
  expect(result.current.groups).toHaveLength(1)

  ;(fetch as jest.Mock).mockResolvedValue(answer({}))
  await act(async () => { await result.current.deleteGroup(1) })
  expect(result.current.groups).toEqual([])
})
