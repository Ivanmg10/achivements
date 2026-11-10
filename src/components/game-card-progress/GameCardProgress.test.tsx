import { render, screen } from '@testing-library/react'
import GameCardProgress from './GameCardProgress'

test('writes the progress and draws the bar with its percentage', () => {
  render(<GameCardProgress progress={{ text: '5 / 10 achievements', done: false, pct: 50 }} label="Halo" />)
  expect(screen.getByText('5 / 10 achievements')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Halo' })).toHaveAttribute('aria-valuenow', '50')
  expect(screen.getByText('50%')).toBeInTheDocument()
})

test('the percentage is the larger of the two shares, hardcore over softcore', () => {
  render(<GameCardProgress progress={{ text: 't', done: false, pct: 20, softPct: 60 }} label="Halo" />)
  expect(screen.getByText('60%')).toBeInTheDocument()
})

test('no bar without progress to tell', () => {
  render(<GameCardProgress progress={{ text: 'Progress unknown', done: false, pct: null }} label="Halo" />)
  expect(screen.getByText('Progress unknown')).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('a finished game is green in the text and the percentage, in words as well', () => {
  render(<GameCardProgress progress={{ text: '10 / 10', done: true, pct: 100 }} label="Halo" />)
  expect(screen.getByText('10 / 10').className).toContain('text-success')
  expect(screen.getByText('100%').className).toContain('text-success')
})
