import { render, screen } from '@testing-library/react'
import LandingSampleGame from './LandingSampleGame'
import { SAMPLE_GAMES } from '@/components/landing-page/landingSamples'

const psn = SAMPLE_GAMES.find((g) => g.source === 'psn' && g.earned < g.total)!
const done = SAMPLE_GAMES.find((g) => g.earned === g.total)!
const ra = SAMPLE_GAMES.find((g) => g.source === 'ra')!
const row = (ui: React.ReactElement) => render(<ul>{ui}</ul>)

test('a library row: the cover, the name and platform, the bar and what it counts, in trophies on PlayStation', () => {
  row(<LandingSampleGame game={psn} />)
  expect(screen.getByText(psn.title)).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: psn.title })).toBeInTheDocument()
  expect(screen.getByRole('listitem')).toHaveTextContent(`${psn.console}, ${psn.earned} of ${psn.total} trophies, ${psn.hours} h`)
})

test('achievements elsewhere, and the console it is played on', () => {
  row(<LandingSampleGame game={ra} />)
  expect(screen.getByRole('listitem')).toHaveTextContent(`${ra.console}, ${ra.earned} of ${ra.total} achievements`)
})

test('the green is only in the percentage of a finished game', () => {
  row(<LandingSampleGame game={done} />)
  for (const pct of screen.getAllByText('100%')) expect(pct).toHaveClass('text-success')
})

test('not a link: it is an example', () => {
  row(<LandingSampleGame game={psn} />)
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})
