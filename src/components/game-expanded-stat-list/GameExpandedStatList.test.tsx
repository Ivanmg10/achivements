import { render, screen } from '@testing-library/react'
import GameExpandedStatList from './GameExpandedStatList'

const STATS = [
  { label: 'Последние 2 недели', value: '12 345 ч', className: 'text-info' },
  { label: 'Completion', value: '25%', className: 'text-success', wide: false },
]

test('each stat is a line of its own, never a column of a narrow row', () => {
  const { container } = render(<GameExpandedStatList stats={STATS} />)
  const list = container.querySelector('dl')!
  expect(list).toHaveClass('flex-col')
  expect(list.className).not.toMatch(/grid-cols/)
  expect(list.querySelectorAll('div')).toHaveLength(2)
})

test('a long label may wrap, a long value stays whole', () => {
  render(<GameExpandedStatList stats={STATS} />)
  expect(screen.getByText('Последние 2 недели').parentElement).toHaveClass('flex-wrap')
  expect(screen.getByText('12 345 ч')).toHaveClass('whitespace-nowrap', 'text-info')
})

test('leaves out on a wide screen what the ring already says', () => {
  render(<GameExpandedStatList stats={STATS} />)
  expect(screen.getByText('Completion').parentElement).toHaveClass('lg:hidden')
  expect(screen.getByText('Последние 2 недели').parentElement).not.toHaveClass('lg:hidden')
})
