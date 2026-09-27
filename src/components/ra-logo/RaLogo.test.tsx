import { render } from '@testing-library/react'
import RaLogo from './RaLogo'

test('is a decorative image at the logo’s aspect ratio', () => {
  const { container } = render(<RaLogo height={22} />)
  const img = container.querySelector('img')!
  expect(img.getAttribute('src')).toContain('ra-logo.webp')
  expect(img.getAttribute('alt')).toBe('')
  expect(img.getAttribute('aria-hidden')).toBe('true')
  expect(img.getAttribute('width')).toBe('40')
  expect(img.getAttribute('height')).toBe('22')
})
