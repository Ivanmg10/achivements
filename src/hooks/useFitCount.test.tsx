import { act, render, screen } from '@testing-library/react'
import { fitCount, useFitCount } from './useFitCount'

test('whole rows only, never fewer than the minimum', () => {
  expect(fitCount(400, 54, 1)).toBe(7)
  expect(fitCount(377, 54, 1)).toBe(6)
  expect(fitCount(20, 54, 3)).toBe(3)
  expect(fitCount(0, 54, 2)).toBe(2)
})

function List() {
  const [ref, count] = useFitCount<HTMLUListElement>(6)
  return (
    <ul ref={ref} aria-label={String(count)}>
      <li />
    </ul>
  )
}

test('what the box holds from the first render (measured before paint), following its size', () => {
  let notify = () => {}
  const disconnect = jest.fn()
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    constructor(cb: () => void) {
      notify = cb
    }
    observe() {}
    disconnect = disconnect
  }
  let height = 400
  const rowHeight = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(50)
  const boxHeight = jest.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(() => height)

  const { unmount } = render(<List />)
  expect(screen.getByRole('list')).toHaveAccessibleName('8')
  height = 900
  act(() => notify())
  expect(screen.getByRole('list')).toHaveAccessibleName('18')
  unmount()
  expect(disconnect).toHaveBeenCalled()

  rowHeight.mockRestore()
  boxHeight.mockRestore()
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver
})

test('without ResizeObserver it keeps the fallback', () => {
  render(<List />)
  expect(screen.getByRole('list')).toHaveAccessibleName('6')
})

function Swapped({ loaded }: { loaded: boolean }) {
  const [ref, count] = useFitCount<HTMLElement>(3)
  return loaded ? <ol ref={ref} aria-label={String(count)}><li /></ol> : <div ref={ref} role="status" aria-label={String(count)}><span /></div>
}

test('a box swapped for another (a skeleton for the list) is measured too', () => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    disconnect() {}
  }
  let height = 200
  const rowHeight = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(50)
  const boxHeight = jest.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(() => height)

  const { rerender } = render(<Swapped loaded={false} />)
  expect(screen.getByRole('status')).toHaveAccessibleName('4')
  height = 300
  rerender(<Swapped loaded />)
  expect(screen.getByRole('list')).toHaveAccessibleName('6')

  rowHeight.mockRestore()
  boxHeight.mockRestore()
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver
})
