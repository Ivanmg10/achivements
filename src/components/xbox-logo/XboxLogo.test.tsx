import { render, screen } from '@testing-library/react'
import XboxLogo from './XboxLogo'

test('is decorative by default, sized and coloured by the caller', () => {
  const { container } = render(<XboxLogo size={18} className="text-[#107c10]" />)
  const svg = container.querySelector('svg')!
  expect(svg.getAttribute('aria-hidden')).toBe('true')
  expect(svg.getAttribute('width')).toBe('18')
  expect(svg.getAttribute('fill')).toBe('currentColor')
})

test('is announced when given a label', () => {
  render(<XboxLogo aria-label="Xbox" />)
  expect(screen.getByRole('img', { name: 'Xbox' })).toBeInTheDocument()
})
