import { render, screen } from '@testing-library/react'
import CompletionDistribution from './CompletionDistribution'
import { en } from '@/translations/en'

test('counts every band and labels each one, so colour is never the only cue', () => {
  render(<CompletionDistribution fractions={[0, 0.3, 0.8, 0.85, 1]} tone="ra" />)
  const card = screen.getByText(en.charts.completionDistTitle).parentElement!
  expect(card).toHaveTextContent('<25%1')
  expect(card).toHaveTextContent('25–49%1')
  expect(card).toHaveTextContent('75–99%2')
  expect(card).toHaveTextContent('100%1')
})

test('describes the whole split for assistive tech', () => {
  render(<CompletionDistribution fractions={[0.1, 1]} tone="steam" />)
  expect(screen.getByRole('img').getAttribute('aria-label')).toBe('<25%: 1, 25–49%: 0, 50–74%: 0, 75–99%: 0, 100%: 1')
})

test('says so without games, and shows the note when given one', () => {
  const { rerender } = render(<CompletionDistribution fractions={[]} tone="ra" />)
  expect(screen.getByText(en.cards.noData)).toBeInTheDocument()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()

  rerender(<CompletionDistribution fractions={[0.5]} tone="ra" note="Some progress is still loading" />)
  expect(screen.getByText('Some progress is still loading')).toBeInTheDocument()
})

test('shows a placeholder while loading', () => {
  const { container } = render(<CompletionDistribution fractions={[]} tone="ra" isLoading />)
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  expect(screen.queryByText(en.charts.completionDistTitle)).not.toBeInTheDocument()
})
