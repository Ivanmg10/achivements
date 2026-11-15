import { fireEvent, render } from '@testing-library/react'
import GroupCoverStrip from './GroupCoverStrip'

const size = (img: HTMLImageElement, natural: number, box: number) => {
  for (const [k, v] of Object.entries({ naturalWidth: natural, naturalHeight: natural, clientWidth: box, clientHeight: box, complete: true })) {
    Object.defineProperty(img, k, { configurable: true, value: v })
  }
}

test('the band split between the covers, one slice each, four at most; decoration', () => {
  const { container } = render(<GroupCoverStrip covers={['a.png', 'b.png', 'c.png', 'd.png', 'e.png']} />)
  const strip = container.firstElementChild as HTMLElement
  expect(strip).toHaveAttribute('aria-hidden', 'true')
  expect(strip.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))')
  expect(container.querySelectorAll('img')).toHaveLength(4)
})

test('a cover big enough fills its slice', () => {
  const { container } = render(<GroupCoverStrip covers={['big.jpg']} />)
  const img = container.querySelector('img')!
  size(img, 600, 230)
  fireEvent.load(img)
  expect(img).toHaveClass('object-cover')
  expect(container.querySelectorAll('img')).toHaveLength(1)
})

test('a small one is never stretched past twice its size: drawn at that, over a blurred copy of itself', () => {
  const { container } = render(<GroupCoverStrip covers={['small.png']} />)
  const img = container.querySelector('img')!
  size(img, 96, 230)
  fireEvent.load(img)
  const [backdrop, cover] = Array.from(container.querySelectorAll('img'))
  expect(backdrop).toHaveClass('blur-xl')
  expect(cover).toHaveClass('object-contain')
  expect(cover.style.width).toBe('192px')
})
