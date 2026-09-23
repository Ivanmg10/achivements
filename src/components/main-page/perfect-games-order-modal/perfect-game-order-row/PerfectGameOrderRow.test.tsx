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
  key: 'ra:1', source: 'ra', id: 1, title: 'Sly Cooper', imageUrl: 'https://retroachievements.org/icon.png',
  subtitle: 'PS2', hardcore: false,
} as never

const hardcoreGame = {
  key: 'ra:2', source: 'ra', id: 2, title: 'Jak 2', imageUrl: 'https://retroachievements.org/icon2.png',
  subtitle: 'PS2', hardcore: true,
} as never

const steamGame = {
  key: 'steam:620', source: 'steam', id: 620, title: 'Portal 2', imageUrl: 'https://cdn/620.jpg',
  subtitle: 'Steam', hardcore: false,
} as never

test('renders the game title and drag handle', () => {
  render(<PerfectGameOrderRow game={softcoreGame} />)
  expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
  expect(screen.getByLabelText('Drag to reorder: Sly Cooper')).toBeInTheDocument()
})

test('does not render a hardcore dot for a softcore game', () => {
  const { container } = render(<PerfectGameOrderRow game={softcoreGame} />)
  expect(container.querySelector('.bg-warning')).not.toBeInTheDocument()
})

test('renders a hardcore dot for a hardcore game', () => {
  const { container } = render(<PerfectGameOrderRow game={hardcoreGame} />)
  expect(container.querySelector('.bg-warning')).toBeInTheDocument()
})

test('marks a Steam game with its logo instead of the hardcore dot', () => {
  const { container } = render(<PerfectGameOrderRow game={steamGame} />)
  expect(screen.getByLabelText('Steam')).toBeInTheDocument()
  expect(container.querySelector('.bg-warning')).not.toBeInTheDocument()
})
