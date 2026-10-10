import { act, renderHook } from '@testing-library/react'
import { useLocationHash } from './useLocationHash'

afterEach(() => { window.location.hash = '' })

test('reads the fragment of the page', () => {
  window.location.hash = '#trophy-5'
  expect(renderHook(() => useLocationHash()).result.current).toBe('#trophy-5')
})

test('is empty when there is none', () => {
  expect(renderHook(() => useLocationHash()).result.current).toBe('')
})

test('follows the fragment changing', () => {
  const { result } = renderHook(() => useLocationHash())
  act(() => {
    window.location.hash = '#ach-A'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
  expect(result.current).toBe('#ach-A')
})
