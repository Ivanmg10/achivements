import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import MainPagePinnedSectionSortableItem from './MainPagePinnedSectionSortableItem'
import { en } from '@/translations/en'

test('hands the tile a grip named after what it moves; the tile stays clickable', () => {
  render(
    <DndContext>
      <SortableContext items={['a']}>
        <ul>
          <MainPagePinnedSectionSortableItem id="a" label="Back in Time">
            {(handle) => (
              <>
                <button type="button">tile</button>
                {handle}
              </>
            )}
          </MainPagePinnedSectionSortableItem>
        </ul>
      </SortableContext>
    </DndContext>,
  )
  expect(screen.getByRole('listitem')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'tile' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `${en.cards.dragToReorder}: Back in Time` })).toBeInTheDocument()
})
