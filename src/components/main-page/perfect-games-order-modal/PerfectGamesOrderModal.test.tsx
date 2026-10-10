import { fireEvent, render, screen } from '@testing-library/react'
import PerfectGamesOrderModal from './PerfectGamesOrderModal'

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: jest.fn((list) => list),
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: jest.fn(),
  verticalListSortingStrategy: jest.fn(),
}))

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(),
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

const games = [
  { key: 'ra:1', source: 'ra', id: 1, title: 'Sly Cooper', imageUrl: '/icon.png', subtitle: 'PS2', hardcore: false },
  { key: 'steam:620', source: 'steam', id: 620, title: 'Portal 2', imageUrl: '/icon2.png', subtitle: 'Steam', hardcore: false },
] as never

test('renders nothing when closed', () => {
  render(
    <PerfectGamesOrderModal isOpen={false} onClose={jest.fn()} games={games} order={[]} onSaveOrder={jest.fn()} />,
  )
  expect(screen.queryByText('Sly Cooper')).not.toBeInTheDocument()
})

test('renders one row per game when open', () => {
  render(
    <PerfectGamesOrderModal isOpen={true} onClose={jest.fn()} games={games} order={[]} onSaveOrder={jest.fn()} />,
  )
  expect(screen.getByText('Sly Cooper')).toBeInTheDocument()
  expect(screen.getByText('Portal 2')).toBeInTheDocument()
})

test('clicking close saves the current order and closes', async () => {
  const onSaveOrder = jest.fn().mockResolvedValue(undefined)
  const onClose = jest.fn()
  render(
    <PerfectGamesOrderModal
      isOpen={true}
      onClose={onClose}
      games={games}
      order={['steam:620', 'ra:1']}
      onSaveOrder={onSaveOrder}
    />,
  )
  fireEvent.click(screen.getByText('Close'))
  await Promise.resolve()
  expect(onSaveOrder).toHaveBeenCalledWith(['steam:620', 'ra:1'])
  expect(onClose).toHaveBeenCalled()
})

test('still closes when saving the order fails', async () => {
  const onSaveOrder = jest.fn().mockRejectedValue(new Error('network error'))
  const onClose = jest.fn()
  jest.spyOn(console, 'error').mockImplementation(() => {})
  render(
    <PerfectGamesOrderModal
      isOpen={true}
      onClose={onClose}
      games={games}
      order={[]}
      onSaveOrder={onSaveOrder}
    />,
  )
  fireEvent.click(screen.getByText('Close'))
  await Promise.resolve()
  await Promise.resolve()
  expect(onClose).toHaveBeenCalled()
  ;(console.error as jest.Mock).mockRestore()
})

test('opening it lists the games in the saved order, and a new order while open is followed', () => {
  const rows = () => screen.getAllByText(/Sly Cooper|Portal 2/).map((n) => n.textContent)
  const { rerender } = render(
    <PerfectGamesOrderModal isOpen onClose={jest.fn()} games={games} order={['steam:620', 'ra:1']} onSaveOrder={jest.fn()} />,
  )
  expect(rows()).toEqual(['Portal 2', 'Sly Cooper'])

  rerender(<PerfectGamesOrderModal isOpen onClose={jest.fn()} games={games} order={['ra:1', 'steam:620']} onSaveOrder={jest.fn()} />)
  expect(rows()).toEqual(['Sly Cooper', 'Portal 2'])
})

test('closed, it keeps nothing: the next opening reads the order again', () => {
  const props = { onClose: jest.fn(), games, onSaveOrder: jest.fn() }
  const { rerender } = render(<PerfectGamesOrderModal isOpen order={['steam:620', 'ra:1']} {...props} />)
  rerender(<PerfectGamesOrderModal isOpen={false} order={['steam:620', 'ra:1']} {...props} />)
  rerender(<PerfectGamesOrderModal isOpen order={['ra:1', 'steam:620']} {...props} />)
  expect(screen.getAllByText(/Sly Cooper|Portal 2/).map((n) => n.textContent)).toEqual(['Sly Cooper', 'Portal 2'])
})
