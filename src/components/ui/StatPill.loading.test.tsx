import { render, screen } from '@testing-library/react'
import { StatCard, StatPill } from './StatPill'

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
