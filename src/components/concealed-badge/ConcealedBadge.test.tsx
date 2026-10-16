import { render } from '@testing-library/react'
import ConcealedBadge from './ConcealedBadge'

test('a question mark in a tile of the badge size, hidden from assistive tech', () => {
  const { container } = render(<ConcealedBadge sizeClass="w-12 h-12" dim={false} />)
  const tile = container.firstElementChild!
  expect(tile).toHaveAttribute('aria-hidden', 'true')
  expect(tile).toHaveClass('w-12', 'h-12')
  expect(tile).not.toHaveClass('opacity-40')
  expect(tile.querySelector('svg')).toBeInTheDocument()
})

test('dimmed like a locked badge when asked', () => {
  const { container } = render(<ConcealedBadge sizeClass="w-10 h-10" dim />)
  expect(container.firstElementChild).toHaveClass('opacity-40')
})
