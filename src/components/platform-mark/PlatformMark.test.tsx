import { render } from '@testing-library/react'
import PlatformMark from './PlatformMark'

test('a decorative mark for Steam and PSN, none for RA', () => {
  const { container, rerender } = render(<PlatformMark source="psn" />)
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  rerender(<PlatformMark source="steam" />)
  expect(container.firstChild).not.toBeNull()
  rerender(<PlatformMark source="ra" />)
  expect(container.firstChild).toBeNull()
})
