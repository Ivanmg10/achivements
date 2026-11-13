import { render } from '@testing-library/react'
import CoverReel from './CoverReel'

const covers = ['a.png', 'b.png', 'c.png']
const sources = (el: Element) => Array.from(el.querySelectorAll('img')).map((img) => img.getAttribute('src'))

test('two identical halves, so sliding by half has no seam; hidden from assistive tech', () => {
  const { container } = render(<CoverReel covers={covers} />)
  const row = container.firstElementChild!
  expect(row).toHaveAttribute('aria-hidden', 'true')
  expect(row).toHaveClass('cover-reel-row')
  const all = sources(row)
  expect(all.slice(0, all.length / 2)).toEqual(all.slice(all.length / 2))
  expect(new Set(all)).toEqual(new Set(covers))
})

test('`back` goes the other way', () => {
  expect(render(<CoverReel covers={covers} />).container.firstElementChild).not.toHaveClass('cover-reel-back')
  expect(render(<CoverReel covers={covers} back />).container.firstElementChild).toHaveClass('cover-reel-back')
})
