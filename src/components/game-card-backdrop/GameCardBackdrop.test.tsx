import { render } from '@testing-library/react'
import GameCardBackdrop from './GameCardBackdrop'
import { NEUTRAL_TINT } from '@/hooks/useImageTint'

test('a flat tint and a border, hidden from assistive tech, never the blurred art', () => {
  const { container } = render(<GameCardBackdrop src="https://example.com/a.png" />)
  const layer = container.firstChild as HTMLElement
  expect(layer).toHaveAttribute('aria-hidden', 'true')
  expect(container.querySelector('img')).toBeNull()
  expect(layer.style.boxShadow).toContain('inset')
})

test('uses a neutral grey until the colour is read, or with no image', () => {
  const { container } = render(<GameCardBackdrop src={null} />)
  expect((container.firstChild as HTMLElement).style.boxShadow).toContain(NEUTRAL_TINT.replaceAll(' ', ' '))
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
