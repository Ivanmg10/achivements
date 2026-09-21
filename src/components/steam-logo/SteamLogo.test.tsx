import { render, screen } from '@testing-library/react'
import SteamLogo from './SteamLogo'

test('is decorative by default, sized and coloured by the caller', () => {
  const { container } = render(<SteamLogo size={14} className="text-[#66c0f4]" />)
  const svg = container.querySelector('svg')!
  expect(svg.getAttribute('aria-hidden')).toBe('true')
  expect(svg.getAttribute('width')).toBe('14')
  expect(svg.getAttribute('fill')).toBe('currentColor')
  expect(svg.getAttribute('class')).toContain('text-[#66c0f4]')
})

test('is announced when given a label', () => {
  render(<SteamLogo aria-label="Steam" />)
  expect(screen.getByRole('img', { name: 'Steam' })).toBeInTheDocument()
})
