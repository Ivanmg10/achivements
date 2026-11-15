import { act, renderHook } from '@testing-library/react'
import { useScrolledPast } from './useScrolledPast'

const scrollTo = (y: number) =>
  act(() => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
    window.dispatchEvent(new Event('scroll'))
  })

afterEach(() => Object.defineProperty(window, 'scrollY', { value: 0, configurable: true }))

test('false at the top, true once the page has moved past the line, false again back at the top', () => {
  const { result } = renderHook(() => useScrolledPast(8))
  expect(result.current).toBe(false)
  scrollTo(8)
  expect(result.current).toBe(false)
  scrollTo(40)
  expect(result.current).toBe(true)
  scrollTo(0)
  expect(result.current).toBe(false)
})
