import { act, renderHook } from '@testing-library/react'
import { createRef } from 'react'
import { useFillViewport } from './useFillViewport'

const boxAt = (top: number) => {
  const el = document.createElement('div')
  jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top } as DOMRect)
  return { current: el }
}
const screenOf = (h: number) => Object.defineProperty(window, 'innerHeight', { value: h, configurable: true })

beforeEach(() => jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => (cb(0), 0)))
afterEach(() => jest.restoreAllMocks())

test('fills what is left of the screen from the top of the box, less the margin below', () => {
  screenOf(1000)
  const { result } = renderHook(() => useFillViewport(boxAt(250), true))
  expect(result.current).toBe(734)
})

test('a box that has scrolled above where a pinned box stops is measured from there', () => {
  screenOf(1000)
  const { result } = renderHook(() => useFillViewport(boxAt(-300), true))
  // 1000 less the 16 it stops at, less the 16 of margin.
  expect(result.current).toBe(968)
})

test('follows the page as it scrolls and the window as it resizes', () => {
  screenOf(1000)
  const ref = boxAt(250)
  const { result } = renderHook(() => useFillViewport(ref, true))
  expect(result.current).toBe(734)
  ;(ref.current.getBoundingClientRect as jest.Mock).mockReturnValue({ top: 130 })
  act(() => { window.dispatchEvent(new Event('scroll')) })
  expect(result.current).toBe(854)
  screenOf(900)
  act(() => { window.dispatchEvent(new Event('resize')) })
  expect(result.current).toBe(754)
})

test('never smaller than the least that is usable', () => {
  screenOf(500)
  const { result } = renderHook(() => useFillViewport(boxAt(400), true))
  expect(result.current).toBe(360)
  const roomy = renderHook(() => useFillViewport(boxAt(400), true, { min: 100 }))
  expect(roomy.result.current).toBe(100 > 84 ? 100 : 84)
})

test('the margin below can be asked for', () => {
  screenOf(1000)
  const { result } = renderHook(() => useFillViewport(boxAt(200), true, { bottom: 40 }))
  expect(result.current).toBe(760)
})

test('nothing when not enabled, and no listeners left behind', () => {
  const add = jest.spyOn(window, 'addEventListener')
  const { result, rerender, unmount } = renderHook(({ on }) => useFillViewport(boxAt(100), on), { initialProps: { on: false } })
  expect(result.current).toBeUndefined()
  expect(add).not.toHaveBeenCalledWith('scroll', expect.anything(), expect.anything())
  rerender({ on: true })
  expect(result.current).toBeDefined()
  const remove = jest.spyOn(window, 'removeEventListener')
  unmount()
  expect(remove).toHaveBeenCalledWith('scroll', expect.anything())
  expect(remove).toHaveBeenCalledWith('resize', expect.anything())
})

test('a box that is not there yet is left alone', () => {
  const { result } = renderHook(() => useFillViewport(createRef<HTMLElement>(), true))
  expect(result.current).toBeUndefined()
})
