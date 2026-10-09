import { render, fireEvent } from '@testing-library/react'
import PsnGameHeroBackground from './PsnGameHeroBackground'

test('decoration only: hidden from assistive tech, fades in, drops out on error', () => {
  const { container } = render(<PsnGameHeroBackground src="https://a.png" />)
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  const img = container.querySelector('img')!
  expect(img).toHaveClass('opacity-0')
  fireEvent.load(img)
  expect(img).toHaveClass('opacity-50')
  fireEvent.error(img)
  expect(container.querySelector('img')).toBeNull()
})
