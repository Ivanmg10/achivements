import { render } from '@testing-library/react'
import PlatformMark from './PlatformMark'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'

test('a decorative mark for Steam and PSN, none for RA', () => {
  const { container, rerender } = render(<PlatformMark source="psn" />)
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  rerender(<PlatformMark source="steam" />)
  expect(container.firstChild).not.toBeNull()
  rerender(<PlatformMark source="ra" />)
  expect(container.firstChild).toBeNull()
})

test("an Xbox game gets Xbox's mark, not PlayStation's", () => {
  const xbox = render(<PlatformMark source="xbox" />).container.innerHTML
  const psn = render(<PlatformMark source="psn" />).container.innerHTML
  expect(xbox).not.toEqual(psn)
  expect(xbox).toContain(render(<PlatformLogo source="xbox" size={11} />).container.innerHTML)
})
