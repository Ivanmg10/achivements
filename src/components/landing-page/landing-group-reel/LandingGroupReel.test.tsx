import { render, screen } from '@testing-library/react'
import LandingGroupReel from './LandingGroupReel'
import { SAMPLE_GROUPS } from '@/components/landing-page/landingSamples'

test('each group once for a screen reader, its copies there only for the loop', () => {
  const { container } = render(<LandingGroupReel groups={SAMPLE_GROUPS} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(SAMPLE_GROUPS.length)
  const all = container.querySelectorAll('li')
  expect(all.length % 2).toBe(0)
  expect(all[0].getAttribute('aria-hidden')).toBeNull()
  expect(all[all.length - 1]).toHaveAttribute('aria-hidden', 'true')
  expect(all[all.length - 1]).toHaveClass('motion-reduce:hidden')
})

test('it moves as the closing band does, and stops under the pointer', () => {
  const { container } = render(<LandingGroupReel groups={SAMPLE_GROUPS} />)
  expect(container.querySelector('ul')).toHaveClass('cover-reel-row', 'hover:[animation-play-state:paused]')
})
