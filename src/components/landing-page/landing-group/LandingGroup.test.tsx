import { render, screen } from '@testing-library/react'
import LandingGroup from './LandingGroup'
import { SAMPLE_GROUPS } from '@/components/landing-page/landingSamples'

const [wide, , blurred] = SAMPLE_GROUPS

test('the name over its shelf art, how far along it is, its bar and what it holds', () => {
  render(<LandingGroup group={wide} />)
  expect(screen.getByRole('heading', { level: 3, name: wide.name })).toBeInTheDocument()
  const pct = Math.round((wide.earned / wide.total) * 100)
  expect(screen.getByText(`${pct}%`)).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: wide.name })).toBeInTheDocument()
  expect(screen.getByRole('article')).toHaveTextContent(`${wide.games} games, ${wide.earned} of ${wide.total} achievements`)
})

test('a group with no wide picture shows a box blown up and blurred, as a shelf does', () => {
  const { container } = render(<LandingGroup group={blurred} />)
  expect(container.querySelector('img')).toHaveClass('blur-2xl')
  expect(render(<LandingGroup group={wide} />).container.querySelector('img')).not.toHaveClass('blur-2xl')
})
