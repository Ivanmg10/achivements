import { render, screen } from '@testing-library/react'
import BrandMark from './BrandMark'
import { LOGO_PATHS } from '@/utils/themeIcon'

test('the name is the text and the logo is a decoration drawn from the favicon\'s own shapes, in the accent', () => {
  const { container } = render(<BrandMark name="CheevoVault" />)
  expect(screen.getByText('CheevoVault')).toHaveClass('font-display', 'italic')
  const svg = container.querySelector('svg')!
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  expect(svg).toHaveClass('text-accent')
  expect(Array.from(svg.querySelectorAll('path')).map((p) => p.getAttribute('d'))).toEqual(LOGO_PATHS)
})

test.each(['sm', 'md', 'lg'] as const)('%s keeps the logo beside the name', (size) => {
  const { container } = render(<BrandMark name="CheevoVault" size={size} />)
  expect(container.firstElementChild!.firstElementChild!.tagName.toLowerCase()).toBe('svg')
})

test('a title puts the logo after the name and may break the name between its words, which stay one word to read', () => {
  const { container } = render(<BrandMark name="CheevoVault" size="title" logoAfter />)
  const box = container.firstElementChild!
  expect(box.lastElementChild!.tagName.toLowerCase()).toBe('svg')
  const name = screen.getByText('CheevoVault')
  expect(name.querySelectorAll('wbr')).toHaveLength(1)
  expect(name.textContent).toBe('CheevoVault')
})
