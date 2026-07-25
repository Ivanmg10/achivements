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
  { GameID: 1, Title: 'Sly Cooper', ImageIcon: '/icon.png', HardcoreMode: '0' },
  { GameID: 2, Title: 'Jak 2', ImageIcon: '/icon2.png', HardcoreMode: '1' },
] as any

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
  expect(screen.getByText('Jak 2')).toBeInTheDocument()
})

test('clicking close saves the current order and closes', async () => {
  const onSaveOrder = jest.fn().mockResolvedValue(undefined)
  const onClose = jest.fn()
  render(
    <PerfectGamesOrderModal
      isOpen={true}
      onClose={onClose}
      games={games}
      order={[2, 1]}
      onSaveOrder={onSaveOrder}
    />,
  )
  fireEvent.click(screen.getByText('Close'))
  await Promise.resolve()
  expect(onSaveOrder).toHaveBeenCalledWith([2, 1])
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
