import { render } from '@testing-library/react'
import GameCardBackdrop from './GameCardBackdrop'
import { NEUTRAL_TINT } from '@/hooks/useImageTint'

test('a flat tint fading to the side, a neutral hairline, hidden from assistive tech, never the blurred art', () => {
  const { container } = render(<GameCardBackdrop src="https://example.com/a.png" />)
  const layer = container.firstChild as HTMLElement
  expect(layer).toHaveAttribute('aria-hidden', 'true')
  expect(container.querySelector('img')).toBeNull()
  expect(layer.style.boxShadow).toContain('inset')
  expect(layer.style.boxShadow).toContain('--ink')
  expect(layer.style.background).toContain('gradient')
})

test('uses a neutral grey until the colour is read, or with no image', () => {
  const { container } = render(<GameCardBackdrop src={null} />)
  const layer = container.firstChild as HTMLElement
  expect(layer.style.background).toContain(NEUTRAL_TINT.replaceAll(' ', ' '))
  expect(layer.style.boxShadow).toContain('--ink')
})

test('sits on the card surface it is given', () => {
  const { container } = render(<GameCardBackdrop src={null} surface="card" />)
  expect((container.firstChild as HTMLElement).style.background).toContain('--bg-card')
})

test('flat: the plain surface and a hairline, with no colour of the game in it', () => {
  localStorage.setItem('game-card-style', 'flat')
  const { container } = render(<GameCardBackdrop src="https://example.com/a.png" />)
  const layer = container.firstChild as HTMLElement
  expect(layer.style.background).not.toContain('gradient')
  expect(layer.style.boxShadow).toContain('--ink')
  localStorage.clear()
})
