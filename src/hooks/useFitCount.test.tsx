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
