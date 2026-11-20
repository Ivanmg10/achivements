import { fireEvent, render, screen } from '@testing-library/react'
import GameHeroCover, { COVER_SLOT } from './GameHeroCover'
import { IGDB_COVER, PORTRAIT } from '@/utils/coverRatio'

/** Fires the picture's load with its natural size. */
function load(img: HTMLElement, w: number, h: number) {
  Object.defineProperty(img, 'naturalWidth', { value: w, configurable: true })
  Object.defineProperty(img, 'naturalHeight', { value: h, configurable: true })
  fireEvent.load(img)
}

const slot = (container: HTMLElement) => container.firstElementChild as HTMLElement
const box = (container: HTMLElement) => slot(container).firstElementChild as HTMLElement

test('the slot is the same width on every page; the box holds a 2:3 portrait until the picture is in', () => {
  const { container } = render(<GameHeroCover sources={['https://img/cover.jpg']} alt="Portal 2" />)
  expect(slot(container).className).toContain(COVER_SLOT)
  expect(Number(box(container).style.aspectRatio)).toBeCloseTo(PORTRAIT)
  expect(box(container)).toHaveAttribute('data-cover', 'loading')
})

test('every picture is shown at its own ratio, whole: no crop, no blurred bands (#203)', () => {
  const { container } = render(<GameHeroCover sources={['https://images.igdb.com/c.jpg']} alt="Sly Cooper" ratio={IGDB_COVER} />)
  expect(Number(box(container).style.aspectRatio)).toBeCloseTo(0.75)
  load(screen.getByRole('img', { name: 'Sly Cooper' }), 528, 704)
  expect(box(container)).toHaveAttribute('data-cover', 'loaded')
  expect(Number(box(container).style.aspectRatio)).toBeCloseTo(528 / 704)
  expect(container.querySelectorAll('img')).toHaveLength(1)
  expect(container.querySelector('.blur-xl')).toBeNull()
})

test('a wide picture keeps its shape too (Steam header with no cover)', () => {
  const { container } = render(<GameHeroCover sources={['https://img/header.jpg']} alt="AC Liberation" />)
  load(screen.getByRole('img', { name: 'AC Liberation' }), 460, 215)
  expect(Number(box(container).style.aspectRatio)).toBeCloseTo(460 / 215)
})

test('a small icon is never blown up: the box is no wider than its pixels', () => {
  const { container } = render(<GameHeroCover sources={['https://img/icon.png']} alt="Game" />)
  load(screen.getByRole('img', { name: 'Game' }), 64, 64)
  expect(box(container).style.maxWidth).toBe('64px')
  expect(box(container).style.aspectRatio).toBe('1')
})

test('a picture that fails steps to the next, and the fallback shows when none is left', () => {
  const { container } = render(<GameHeroCover sources={['https://img/a.jpg', null, 'https://img/b.jpg']} alt="Game" fallback={<span>no art</span>} />)
  fireEvent.error(screen.getByRole('img', { name: 'Game' }))
  expect(screen.getByRole('img', { name: 'Game' })).toHaveAttribute('src', 'https://img/b.jpg')
  fireEvent.error(screen.getByRole('img', { name: 'Game' }))
  expect(screen.getByText('no art')).toBeInTheDocument()
  expect(Number(box(container).style.aspectRatio)).toBeCloseTo(PORTRAIT)
})

test('while pending it holds the box with no picture, so no icon is swapped for the cover', () => {
  const { container } = render(<GameHeroCover sources={['https://img/icon.png']} alt="Game" pending ratio={IGDB_COVER} />)
  expect(container.querySelector('img')).toBeNull()
  expect(box(container)).toHaveClass('bg-skeleton')
  expect(Number(box(container).style.aspectRatio)).toBeCloseTo(0.75)
})
