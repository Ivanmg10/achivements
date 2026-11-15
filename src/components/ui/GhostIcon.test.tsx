import { render } from '@testing-library/react'
import { IconTrophy } from '@tabler/icons-react'
import GhostIcon from './GhostIcon'

test('is a decoration: hidden from a screen reader, inside its card, never in the way of a click', () => {
  const { container } = render(<GhostIcon icon={IconTrophy} />)
  const svg = container.querySelector('svg')!
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  expect(svg).toHaveClass('right-6', 'top-6', 'pointer-events-none', 'text-accent/10')
})
