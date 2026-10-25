import { act, renderHook } from '@testing-library/react'
import { useActiveSection } from './useActiveSection'

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void
let callback: Callback = () => {}
const disconnect = jest.fn()

beforeEach(() => {
  document.body.innerHTML = '<section id="a"></section><section id="b"></section><section id="c"></section>'
  disconnect.mockClear()
  global.IntersectionObserver = jest.fn((cb: Callback) => {
    callback = cb
    return { observe: jest.fn(), disconnect, unobserve: jest.fn(), takeRecords: jest.fn(), root: null, rootMargin: '', thresholds: [] }
  }) as unknown as typeof IntersectionObserver
})

const seen = (id: string, top: number, isIntersecting = true) => ({ target: document.getElementById(id)!, isIntersecting, boundingClientRect: { top } as DOMRectReadOnly })

test('starts on the first section', () => {
  const { result } = renderHook(() => useActiveSection(['a', 'b', 'c']))
  expect(result.current).toBe('a')
})

test('follows the section just being reached, and keeps the last when none is in view', () => {
  const ids = ['a', 'b', 'c']
  const { result } = renderHook(() => useActiveSection(ids))
  act(() => callback([seen('a', 100)]))
  expect(result.current).toBe('a')
  // b enters while a is still leaving: b is the one being read.
  act(() => callback([seen('b', 400)]))
  expect(result.current).toBe('b')
  act(() => callback([seen('a', 0, false)]))
  expect(result.current).toBe('b')
  act(() => callback([seen('b', 0, false)]))
  expect(result.current).toBe('b')
})

test('stops watching when it goes away', () => {
  const { unmount } = renderHook(() => useActiveSection(['a']))
  unmount()
  expect(disconnect).toHaveBeenCalled()
})
