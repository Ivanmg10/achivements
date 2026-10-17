// The drag itself is dnd-kit's; what is ours is what a finished drag reports.
let endDrag: (event: { active: { id: string }; over: { id: string } | null }) => void = () => {}
jest.mock('@dnd-kit/core', () => ({
  ...jest.requireActual('@dnd-kit/core'),
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: typeof endDrag }) => {
    endDrag = onDragEnd
    return <>{children}</>
  },
}))

import { render, screen, act } from '@testing-library/react'
import MainPagePinnedSectionSortable from './MainPagePinnedSectionSortable'
import { en } from '@/translations/en'

const ITEMS = [
  { id: 'a', name: 'Alpha' },
  { id: 'b', name: 'Beta' },
  { id: 'c', name: 'Gamma' },
]

function renderGrid(onReorder = jest.fn()) {
  render(
    <MainPagePinnedSectionSortable
      items={ITEMS}
      idOf={(i) => i.id}
      labelOf={(i) => i.name}
      onReorder={onReorder}
      className="grid"
      renderItem={(i, handle) => (
        <div>
          {i.name}
          {handle}
        </div>
      )}
    />,
  )
  return onReorder
}

test('each tile gets a grip named after it, in a list', () => {
  renderGrid()
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
  expect(screen.getByRole('button', { name: `${en.cards.dragToReorder}: Beta` })).toBeInTheDocument()
})

test('a tile dropped on another reports the new order', () => {
  const onReorder = renderGrid()
  act(() => endDrag({ active: { id: 'c' }, over: { id: 'a' } }))
  expect(onReorder).toHaveBeenCalledWith([ITEMS[2], ITEMS[0], ITEMS[1]])
})

test('dropped on itself or outside, nothing changes', () => {
  const onReorder = renderGrid()
  act(() => endDrag({ active: { id: 'b' }, over: { id: 'b' } }))
  act(() => endDrag({ active: { id: 'b' }, over: null }))
  expect(onReorder).not.toHaveBeenCalled()
})
