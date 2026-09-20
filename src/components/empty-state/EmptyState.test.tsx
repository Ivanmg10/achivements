import { render, screen } from '@testing-library/react'
import EmptyState from './EmptyState'

test('renders icon, title and subtitle', () => {
  render(<EmptyState icon="🎮" title="No games" subtitle="Come back later" />)
  expect(screen.getByText('🎮')).toBeInTheDocument()
  expect(screen.getByText('No games')).toBeInTheDocument()
  expect(screen.getByText('Come back later')).toBeInTheDocument()
})

test('omits the subtitle paragraph when none is given', () => {
  render(<EmptyState icon="🎮" title="No games" />)
  expect(screen.getByText('No games')).toBeInTheDocument()
  expect(screen.queryByText('Come back later')).not.toBeInTheDocument()
})

test('accepts an icon component instead of an emoji string', () => {
  render(<EmptyState icon={<svg data-testid="icon-svg" />} title="No groups" />)
  expect(screen.getByTestId('icon-svg')).toBeInTheDocument()
})

test('applies compact sizing when size="compact"', () => {
  render(<EmptyState icon="🎮" title="No data" size="compact" />)
  expect(screen.getByText('No data')).toHaveClass('text-xs')
})

test('defaults to the larger, page-level sizing', () => {
  render(<EmptyState icon="🎮" title="No data" />)
  expect(screen.getByText('No data')).toHaveClass('text-base')
})
