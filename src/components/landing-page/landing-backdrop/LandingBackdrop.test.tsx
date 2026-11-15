import { render } from '@testing-library/react'
import LandingBackdrop from './LandingBackdrop'
import { ART_WALL_RA } from '@/utils/artWall'

test('one picture of the wall that drifts, from the pool\'s small boxes, hidden from assistive tech', () => {
  const { container } = render(<LandingBackdrop />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(container.querySelectorAll('.title-drift')).toHaveLength(1)
  const imgs = Array.from(container.querySelectorAll('img'))
  expect(imgs).toHaveLength(100)
  expect(new Set(imgs.map((img) => img.getAttribute('src'))).size).toBe(40)
  for (const img of imgs) expect(ART_WALL_RA).toContain(img.getAttribute('src'))
})

test('drawn the same everywhere, so the server\'s HTML is what the browser keeps', () => {
  const a = render(<LandingBackdrop />).container.innerHTML
  const b = render(<LandingBackdrop />).container.innerHTML
  expect(a).toBe(b)
})
