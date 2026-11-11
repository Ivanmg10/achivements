import { render, screen } from '@testing-library/react'
import LibraryPlatformBadge from './LibraryPlatformBadge'

test('a list row says the platform: the logo on a phone, the name from sm, the name always for a screen reader', () => {
  const { container } = render(<LibraryPlatformBadge source="steam" size="tag" />)
  expect(screen.getByText('Steam')).toHaveClass('max-sm:sr-only')
  expect(container.querySelector('svg')).toHaveClass('sm:hidden')
})

test('large, beside an open game, the logo and the name', () => {
  render(<LibraryPlatformBadge source="psn" size="lg" />)
  expect(screen.getByText('PlayStation')).toBeInTheDocument()
})
