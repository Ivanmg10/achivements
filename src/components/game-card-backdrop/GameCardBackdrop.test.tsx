import { fireEvent, render } from '@testing-library/react'
import GameCardBackdrop from './GameCardBackdrop'

test('draws the art, hidden from assistive tech', () => {
  const { container } = render(<GameCardBackdrop src="https://example.com/a.png" />)
  const img = container.querySelector('img')
  expect(img).toBeInTheDocument()
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
})

test('renders nothing without an image', () => {
  const { container } = render(<GameCardBackdrop src={null} />)
  expect(container).toBeEmptyDOMElement()
})

test('removes itself when the image fails', () => {
  const { container } = render(<GameCardBackdrop src="https://example.com/broken.png" />)
  fireEvent.error(container.querySelector('img')!)
  expect(container).toBeEmptyDOMElement()
})
