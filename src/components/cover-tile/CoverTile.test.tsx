import { render, fireEvent } from '@testing-library/react'
import CoverTile from './CoverTile'

test('a decoration: no alt, hidden, asked for last, placed and turned by its caller', () => {
  const { container } = render(<CoverTile src="https://example.org/a.png" size="w-16 h-16" style={{ transform: 'rotate(8deg)' }} />)
  const tile = container.firstElementChild as HTMLElement
  const img = container.querySelector('img')!
  expect(tile).toHaveAttribute('data-tile')
  expect(tile.style.transform).toBe('rotate(8deg)')
  expect(img).toHaveAttribute('alt', '')
  expect(img).toHaveAttribute('aria-hidden', 'true')
  expect(img).toHaveAttribute('loading', 'lazy')
  expect(img).toHaveAttribute('fetchpriority', 'low')
  expect(img).toHaveClass('w-16', 'h-16')
})

test('lifts under the pointer only when asked (the sign-in\'s wall)', () => {
  expect(render(<CoverTile src="a.png" size="" />).container.innerHTML).not.toContain('hover:scale-110')
  expect(render(<CoverTile src="a.png" size="" hover />).container.innerHTML).toContain('hover:scale-110')
})

test('a dead picture hides itself instead of leaving a broken icon', () => {
  const { container } = render(<CoverTile src="a.png" size="" />)
  const img = container.querySelector('img')!
  fireEvent.error(img)
  expect(img.style.visibility).toBe('hidden')
})
