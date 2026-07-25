import { render, screen } from '@testing-library/react'
import PerfectGameOrderRow from './PerfectGameOrderRow'

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

const softcoreGame = {
  GameID: 1,
  Title: 'Sly Cooper',
  ImageIcon: '/icon.png',
  HardcoreMode: '0',
} as any

const hardcoreGame = {
  GameID: 2,
  Title: 'Jak 2',
  ImageIcon: '/icon2.png',
  HardcoreMode: '1',
} as any

test('renders the game title and drag handle', () => {
  render(<PerfectGameOrderRow game={softcoreGame} />)
  expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
  expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument()
})

test('does not render a hardcore dot for a softcore game', () => {
  const { container } = render(<PerfectGameOrderRow game={softcoreGame} />)
  expect(container.querySelector('.bg-warning')).not.toBeInTheDocument()
})

test('renders a hardcore dot for a hardcore game', () => {
  const { container } = render(<PerfectGameOrderRow game={hardcoreGame} />)
  expect(container.querySelector('.bg-warning')).toBeInTheDocument()
})
