import { render, fireEvent } from '@testing-library/react'
import XboxGameHeroBackground from './XboxGameHeroBackground'

test('decoration only: hidden from assistive tech, fades in, drops out on error', () => {
  const { container } = render(<XboxGameHeroBackground src="https://a.png" />)
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  const img = container.querySelector('img')!
  expect(img).toHaveClass('opacity-0')
  fireEvent.load(img)
  expect(img).toHaveClass('opacity-50')
  fireEvent.error(img)
  expect(container.querySelector('img')).toBeNull()
})

test('with no art there is nothing to draw', () => {
  const { container } = render(<XboxGameHeroBackground src="" />)
  expect(container).toBeEmptyDOMElement()
})
