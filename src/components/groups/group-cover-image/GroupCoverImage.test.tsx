import { fireEvent, render } from '@testing-library/react'
import GroupCoverImage from './GroupCoverImage'

const size = (img: HTMLImageElement, natural: number, box: number) => {
  for (const [k, v] of Object.entries({ naturalWidth: natural, naturalHeight: natural, clientWidth: box, clientHeight: box, complete: true })) {
    Object.defineProperty(img, k, { configurable: true, value: v })
  }
}

test('each source that fails steps to the next; none left, the box stays, empty', () => {
  const { container } = render(<GroupCoverImage sources={['cover.jpg', 'header.jpg', 'icon.ico']} />)
  const src = () => container.querySelector('img')?.getAttribute('src')
  expect(src()).toBe('cover.jpg')
  fireEvent.error(container.querySelector('img')!)
  expect(src()).toBe('header.jpg')
  fireEvent.error(container.querySelector('img')!)
  expect(src()).toBe('icon.ico')
  fireEvent.error(container.querySelector('img')!)
  expect(container.querySelector('img')).toBeNull()
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
})

test('a portrait is cut from its top', () => {
  const { container } = render(<GroupCoverImage sources={['cover.jpg']} />)
  const img = container.querySelector('img')!
  size(img, 600, 180)
  fireEvent.load(img)
  expect(img).toHaveClass('object-cover', 'object-top')
})

test('a 32 px icon in a big tile is drawn at 64 px at most, over a blurred copy', () => {
  const { container } = render(<GroupCoverImage sources={['icon.ico']} />)
  const img = container.querySelector('img')!
  size(img, 32, 180)
  fireEvent.load(img)
  const [backdrop, art] = Array.from(container.querySelectorAll('img'))
  expect(backdrop).toHaveClass('blur-xl')
  expect(art.style.width).toBe('64px')
})
