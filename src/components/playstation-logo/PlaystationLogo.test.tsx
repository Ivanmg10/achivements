import { render, screen } from '@testing-library/react'
import PlaystationLogo from './PlaystationLogo'

test('is decorative by default, sized and coloured by the caller', () => {
  const { container } = render(<PlaystationLogo size={18} className="text-[#0070d1]" />)
  const svg = container.querySelector('svg')!
  expect(svg.getAttribute('aria-hidden')).toBe('true')
  expect(svg.getAttribute('width')).toBe('18')
  expect(svg.getAttribute('fill')).toBe('currentColor')
})

test('is announced when given a label', () => {
  render(<PlaystationLogo aria-label="PlayStation" />)
  expect(screen.getByRole('img', { name: 'PlayStation' })).toBeInTheDocument()
})
