import { act, render } from '@testing-library/react'
import { useEnterOnView } from './useEnterOnView'

type Entry = { isIntersecting: boolean; boundingClientRect: { top: number } }
let fire: (entry: Entry) => void
const disconnect = jest.fn()

beforeEach(() => {
  disconnect.mockClear()
  window.innerHeight = 800
  ;(window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = jest.fn((cb: (e: Entry[]) => void) => {
    fire = (entry) => act(() => cb([entry]))
    return { observe: jest.fn(), disconnect }
  })
})

function Block({ entrance }: { entrance?: string }) {
  const { ref, className } = useEnterOnView(entrance)
  return <div ref={ref} data-testid="b" className={className} />
}
const block = (ui = <Block />) => render(ui).container.firstElementChild as HTMLElement

test('shown as the server drew it until the script has seen where it is', () => {
  expect(block().className).toBe('')
})

test('below the screen it waits out of sight, then plays the entrance once it is reached', () => {
  const el = block()
  fire({ isIntersecting: false, boundingClientRect: { top: 1600 } })
  expect(el).toHaveClass('enter-on-view', 'enter-wait')
  fire({ isIntersecting: true, boundingClientRect: { top: 500 } })
  expect(el).toHaveClass('enter-on-view', 'enter-rise')
  expect(el).not.toHaveClass('enter-wait')
  expect(disconnect).toHaveBeenCalled()
})

test('takes another of the library\'s entrances', () => {
  const el = block(<Block entrance="enter-card" />)
  fire({ isIntersecting: false, boundingClientRect: { top: 1600 } })
  fire({ isIntersecting: true, boundingClientRect: { top: 500 } })
  expect(el).toHaveClass('enter-card')
})

test('on screen at first, or already passed, it stays as it is and plays nothing', () => {
  const onScreen = block()
  fire({ isIntersecting: true, boundingClientRect: { top: 100 } })
  expect(onScreen.className).toBe('')
  const passed = block()
  fire({ isIntersecting: false, boundingClientRect: { top: -900 } })
  expect(passed.className).toBe('')
  expect(disconnect).toHaveBeenCalled()
})
