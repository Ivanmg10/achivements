import { renderHook, act } from '@testing-library/react'
import { useStoredChoice } from './useStoredChoice'

const OPTIONS = ['ra', 'steam'] as const

beforeEach(() => window.localStorage.clear())

test('starts on the default', () => {
  const { result } = renderHook(() => useStoredChoice('k', OPTIONS, 'ra'))
  expect(result.current[0]).toBe('ra')
})

test('remembers a choice for the next visit', () => {
  const first = renderHook(() => useStoredChoice('k', OPTIONS, 'ra'))
  act(() => first.result.current[1]('steam'))
  expect(first.result.current[0]).toBe('steam')
  first.unmount()

  const second = renderHook(() => useStoredChoice('k', OPTIONS, 'ra'))
  expect(second.result.current[0]).toBe('steam')
})

test('ignores a stored value that is not one of the options', () => {
  window.localStorage.setItem('k', 'epic')
  const { result } = renderHook(() => useStoredChoice('k', OPTIONS, 'ra'))
  expect(result.current[0]).toBe('ra')
})

test('keeps choices under separate keys apart', () => {
  window.localStorage.setItem('a', 'steam')
  const { result } = renderHook(() => useStoredChoice('b', OPTIONS, 'ra'))
  expect(result.current[0]).toBe('ra')
})

test('still works when storage throws', () => {
  const get = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  const set = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })

  const { result } = renderHook(() => useStoredChoice('k', OPTIONS, 'ra'))
  expect(result.current[0]).toBe('ra')
  act(() => result.current[1]('steam'))
  expect(result.current[0]).toBe('steam')

  get.mockRestore()
  set.mockRestore()
})
