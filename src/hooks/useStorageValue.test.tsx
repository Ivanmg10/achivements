import { act, renderHook } from '@testing-library/react'
import { forgetUnsavedValues, useStorageValue } from './useStorageValue'

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  forgetUnsavedValues()
})

test('reads what is saved, and null when nothing is', () => {
  window.localStorage.setItem('a', 'x')
  expect(renderHook(() => useStorageValue('a')).result.current[0]).toBe('x')
  expect(renderHook(() => useStorageValue('b')).result.current[0]).toBeNull()
})

test('a value written is remembered and shared by every component asking', () => {
  const one = renderHook(() => useStorageValue('a'))
  const two = renderHook(() => useStorageValue('a'))
  act(() => one.result.current[1]('y'))
  expect(two.result.current[0]).toBe('y')
  expect(window.localStorage.getItem('a')).toBe('y')
})

test('null removes it', () => {
  window.localStorage.setItem('a', 'x')
  const { result } = renderHook(() => useStorageValue('a'))
  act(() => result.current[1](null))
  expect(result.current[0]).toBeNull()
  expect(window.localStorage.getItem('a')).toBeNull()
})

test('local and session storage are separate', () => {
  const local = renderHook(() => useStorageValue('a', 'local'))
  const session = renderHook(() => useStorageValue('a', 'session'))
  act(() => session.result.current[1]('s'))
  expect(session.result.current[0]).toBe('s')
  expect(local.result.current[0]).toBeNull()
  expect(window.sessionStorage.getItem('a')).toBe('s')
})

test('a change made in another tab arrives through the storage event', () => {
  const { result } = renderHook(() => useStorageValue('a'))
  act(() => {
    window.localStorage.setItem('a', 'other-tab')
    window.dispatchEvent(new StorageEvent('storage', { key: 'a' }))
  })
  expect(result.current[0]).toBe('other-tab')
})

test('a null key reads nothing and writes nothing', () => {
  const { result } = renderHook(() => useStorageValue(null))
  expect(result.current[0]).toBeNull()
  act(() => result.current[1]('x'))
  expect(result.current[0]).toBeNull()
  expect(window.localStorage.length).toBe(0)
})

test('with storage blocked the value still applies until the page is left', () => {
  const get = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  const set = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  const { result } = renderHook(() => useStorageValue('a'))
  expect(result.current[0]).toBeNull()
  act(() => result.current[1]('kept'))
  expect(result.current[0]).toBe('kept')
  get.mockRestore()
  set.mockRestore()
})

test('before hydration the value is undefined, so server and client agree', () => {
  const { renderToString } = jest.requireActual('react-dom/server') as { renderToString: (e: React.ReactElement) => string }
  window.localStorage.setItem('a', 'x')
  function Probe() {
    const [value] = useStorageValue('a')
    return <span>{String(value)}</span>
  }
  expect(renderToString(<Probe />)).toContain('undefined')
})
