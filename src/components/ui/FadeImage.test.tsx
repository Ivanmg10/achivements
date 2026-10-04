import { fireEvent, render, screen } from '@testing-library/react'
import { FadeImage } from './FadeImage'

const box = () => screen.getByRole('img').parentElement!

test('holds a pulsing placeholder in its shape until the picture loads, then fades it in', () => {
  render(<FadeImage src="https://example.com/a.png" alt="Zelda" width={64} height={64} className="w-16 h-16 rounded-xl" />)
  const img = screen.getByRole('img', { name: 'Zelda' })
  expect(img).toHaveClass('opacity-0')
  expect(box()).toHaveClass('animate-pulse', 'w-16', 'h-16', 'rounded-xl')

  fireEvent.load(img)
  expect(img).toHaveClass('opacity-100')
  expect(box()).not.toHaveClass('animate-pulse')
})

test('the loading-only classes go once it has loaded', () => {
  render(<FadeImage src="https://example.com/a.png" alt="box" width={150} height={200} placeholderClassName="aspect-[3/4]" />)
  expect(box()).toHaveClass('aspect-[3/4]')
  fireEvent.load(screen.getByRole('img'))
  expect(box()).not.toHaveClass('aspect-[3/4]')
})

test('a picture that fails leaves a still placeholder, not a broken icon', () => {
  const { container } = render(<FadeImage src="https://example.com/broken.png" alt="x" width={64} height={64} className="w-16 h-16" />)
  fireEvent.error(screen.getByRole('img'))
  expect(container.querySelector('img')).toBeNull()
  expect(container.firstElementChild).not.toHaveClass('animate-pulse')
  expect(container.firstElementChild).toHaveClass('w-16', 'h-16')
})
