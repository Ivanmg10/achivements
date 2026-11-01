import { render, screen } from '@testing-library/react'
import { StatCard, StatPill } from './StatPill'

test('a large pill on its way keeps the line under its figure, so the row does not grow when it lands', () => {
  const { container, rerender } = render(<StatPill label="Today" value="" loading />)
  expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(2)
  rerender(<StatPill label="Level" value="" sub="Steam" loading />)
  expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(1)
  expect(screen.getByText('Steam')).toBeInTheDocument()
})

test('a figure on its way is a block in its line, with its label kept', () => {
  const { container, rerender } = render(<StatPill label="Today" value="" loading />)
  expect(screen.getByText('Today')).toBeInTheDocument()
  expect(container.querySelector('.bg-skeleton')).toHaveClass('h-[1lh]')
  rerender(<StatPill label="Today" value="" size="sm" loading />)
  expect(container.querySelector('.bg-skeleton')).toBeInTheDocument()
  rerender(<StatCard label="Games" value="12" loading />)
  expect(screen.queryByText('12')).not.toBeInTheDocument()
  expect(container.querySelector('.bg-skeleton')).toBeInTheDocument()
})
