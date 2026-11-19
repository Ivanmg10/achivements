import { fireEvent, render, screen } from '@testing-library/react'
import GameHeroCover from './GameHeroCover'

/** Fires the picture's load with its natural size. */
function load(img: HTMLElement, w: number, h: number) {
  Object.defineProperty(img, 'naturalWidth', { value: w, configurable: true })
  Object.defineProperty(img, 'naturalHeight', { value: h, configurable: true })
  fireEvent.load(img)
}

const box = (container: HTMLElement) => container.firstElementChild as HTMLElement

test('a portrait covers the 2:3 frame, with no blurred copy behind it', () => {
  const { container } = render(<GameHeroCover sources={['https://img/cover.jpg']} alt="Portal 2" />)
  expect(box(container)).toHaveClass('aspect-2/3')
  load(screen.getByRole('img', { name: 'Portal 2' }), 600, 900)
  expect(box(container)).toHaveAttribute('data-cover-fit', 'cover')
  expect(container.querySelectorAll('img')).toHaveLength(1)
})

test('another shape is shown whole, over a blurred copy of itself that fills the frame', () => {
  const { container } = render(<GameHeroCover sources={['https://img/icon.png']} alt="GTA" />)
  load(screen.getByRole('img', { name: 'GTA' }), 320, 176)
  expect(box(container)).toHaveAttribute('data-cover-fit', 'contain')
  expect(screen.getByRole('img', { name: 'GTA' })).toHaveClass('object-contain')
  expect(container.querySelector('img[aria-hidden="true"]')).toHaveClass('blur-xl')
})

test('a picture that fails steps to the next, and the fallback shows when none is left', () => {
  const { container } = render(<GameHeroCover sources={['https://img/a.jpg', null, 'https://img/b.jpg']} alt="Game" fallback={<span>no art</span>} />)
  fireEvent.error(screen.getByRole('img', { name: 'Game' }))
  expect(screen.getByRole('img', { name: 'Game' })).toHaveAttribute('src', 'https://img/b.jpg')
  fireEvent.error(screen.getByRole('img', { name: 'Game' }))
  expect(screen.getByText('no art')).toBeInTheDocument()
  expect(box(container)).toHaveClass('aspect-2/3')
})

test('while pending it holds the frame with no picture, so no icon is swapped for the cover', () => {
  const { container } = render(<GameHeroCover sources={['https://img/icon.png']} alt="Game" pending />)
  expect(container.querySelector('img')).toBeNull()
  expect(box(container)).toHaveClass('bg-skeleton')
})

test("RA's box keeps its own ratio: the console's until loaded, then the picture's", () => {
  const { container } = render(<GameHeroCover sources={['/box.png']} alt="Pokémon" natural ratio={1.11} optimized />)
  expect(box(container)).not.toHaveClass('aspect-2/3')
  expect(box(container).style.aspectRatio).toBe('1.11')
  load(screen.getByRole('img', { name: 'Pokémon' }), 320, 288)
  expect(Number(box(container).style.aspectRatio)).toBeCloseTo(320 / 288)
  expect(container.querySelectorAll('img')).toHaveLength(1)
})
