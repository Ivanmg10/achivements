import { render } from '@testing-library/react'
import DataBar from './DataBar'

test('a horizontal bar is as long as its share, upright, hidden from a screen reader', () => {
  const { container } = render(<DataBar share={0.25} className="h-2" />)
  const bar = container.firstElementChild as HTMLElement
  expect(bar).toHaveAttribute('aria-hidden', 'true')
  expect(bar).toHaveClass('bg-accent', 'h-2', 'rounded-(--bar-radius)')
  expect(bar.style.width).toBe('max(0px, 25%)')
  expect(bar.style.clipPath).toBe('')
  expect(bar.className).not.toContain('skew')
})

test('with a track, the rest of the way is drawn under it and the bar fills its height', () => {
  const { container } = render(<DataBar track share={0.5} className="h-2" />)
  const trackEl = container.firstElementChild as HTMLElement
  expect(trackEl).toHaveClass('bg-ink/[0.08]', 'h-2', 'overflow-hidden')
  expect(trackEl.firstElementChild).toHaveClass('h-full')
})

test('a vertical bar takes its height, keeps a minimum, grows in and takes a colour over its tone', () => {
  const { container } = render(<DataBar axis="y" share={1.4} min={4} grow color="rgb(1 2 3)" className="w-full" />)
  const bar = container.firstElementChild as HTMLElement
  expect(bar.style.height).toBe('max(4px, 100%)')
  expect(bar).toHaveClass('enter-grow-y')
  expect(bar).not.toHaveClass('bg-accent')
  expect(bar.style.backgroundColor).toBe('rgb(1, 2, 3)')
})
