import { act, renderHook } from '@testing-library/react'
import { SETTLE_MS, useSectionScroll } from './useSectionScroll'

jest.mock('framer-motion', () => ({ useReducedMotion: jest.fn(() => false) }))

let resize: (() => void) | null = null
const disconnect = jest.fn()

beforeEach(() => {
  jest.useFakeTimers()
  resize = null
  disconnect.mockClear()
  global.ResizeObserver = class {
    constructor(cb: () => void) {
      resize = cb
    }
    observe() {}
    unobserve() {}
    disconnect = disconnect
  } as unknown as typeof ResizeObserver
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0)
    return 0
  })
})

afterEach(() => jest.useRealTimers())

function setup() {
  const el = document.createElement('section')
  el.scrollIntoView = jest.fn()
  const { result, unmount } = renderHook(() => useSectionScroll<HTMLElement>())
  result.current.ref.current = el
  return { el, result, unmount }
}

test('brings the top into view, and again while what is inside grows', () => {
  const { el, result } = setup()
  act(() => result.current.scrollToTop())
  expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  resize?.()
  resize?.()
  expect(el.scrollIntoView).toHaveBeenCalledTimes(3)
})

test('lets go once the user scrolls on their own', () => {
  const { result } = setup()
  act(() => result.current.scrollToTop())
  window.dispatchEvent(new Event('wheel'))
  expect(disconnect).toHaveBeenCalled()
})

test('lets go after a while, and when the page goes away', () => {
  const { result, unmount } = setup()
  act(() => result.current.scrollToTop())
  act(() => jest.advanceTimersByTime(SETTLE_MS))
  expect(disconnect).toHaveBeenCalledTimes(1)
  act(() => result.current.scrollToTop())
  unmount()
  expect(disconnect).toHaveBeenCalledTimes(2)
})
