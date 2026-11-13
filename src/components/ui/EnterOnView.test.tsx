import { act, render, screen } from '@testing-library/react'
import EnterOnView from './EnterOnView'

test('its content is there from the first frame, and it enters once scrolled to', () => {
  let fire: (top: number, on: boolean) => void = () => {}
  ;(window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = jest.fn((cb) => {
    fire = (top, on) => act(() => cb([{ isIntersecting: on, boundingClientRect: { top } }]))
    return { observe: jest.fn(), disconnect: jest.fn() }
  })
  render(<EnterOnView className="mt-4"><p>Section</p></EnterOnView>)
  const box = screen.getByText('Section').parentElement!
  expect(box).toHaveClass('mt-4')
  expect(box).not.toHaveClass('enter-wait')
  fire(5000, false)
  expect(box).toHaveClass('enter-wait')
  fire(300, true)
  expect(box).toHaveClass('enter-rise')
})
