import { render } from '@testing-library/react'
import { RememberedHeight, rememberedHeight } from './RememberedHeight'

beforeEach(() => localStorage.clear())

test('a saved height counts only on a screen about as wide', () => {
  expect(rememberedHeight('1440:900', 1500)).toBe(900)
  expect(rememberedHeight('1440:900', 390)).toBeNull()
  expect(rememberedHeight('nonsense', 1440)).toBeNull()
  expect(rememberedHeight(null, 1440)).toBeNull()
})

test('keeps the room it had the last time while it loads', () => {
  localStorage.setItem('block-height:friends', `${window.innerWidth}:640`)
  const { container, rerender } = render(<RememberedHeight id="friends" loading>x</RememberedHeight>)
  expect(container.firstElementChild).toHaveStyle({ minHeight: '640px' })
  rerender(<RememberedHeight id="friends" loading={false}>x</RememberedHeight>)
  expect((container.firstElementChild as HTMLElement).style.minHeight).toBe('')
})

test('saves its height once loaded, never while hidden or loading', () => {
  const height = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get')
  height.mockReturnValue(0)
  const { rerender } = render(<RememberedHeight id="friends" loading={false}>x</RememberedHeight>)
  expect(localStorage.getItem('block-height:friends')).toBeNull()
  height.mockReturnValue(500)
  rerender(<RememberedHeight id="friends" loading>x</RememberedHeight>)
  expect(localStorage.getItem('block-height:friends')).toBeNull()
  rerender(<RememberedHeight id="friends" loading={false}>x</RememberedHeight>)
  expect(localStorage.getItem('block-height:friends')).toBe(`${window.innerWidth}:500`)
  height.mockRestore()
})
