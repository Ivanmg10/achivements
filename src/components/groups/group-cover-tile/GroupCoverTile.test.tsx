import { fireEvent, render, screen } from '@testing-library/react'
import GroupCoverTile from './GroupCoverTile'
import type { GameGroupItem } from '@/types/types'

jest.mock('next/image', () => ({ src, alt, ...props }: React.ComponentProps<'img'>) => <img src={src as string} alt={alt} {...props} />)
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: jest.fn(), transform: null, transition: undefined, isDragging: false }),
}))

const item = { id: 9, source: 'steam', game_id: 620, title: 'Portal 2', image_icon: 'https://cdn/620.jpg', console_name: 'Steam' } as GameGroupItem

function tile(progress = { earned: 20, total: 30, pct: 20 / 30 }, draggable = true, onRemove = jest.fn()) {
  render(<ul><GroupCoverTile item={item} progress={progress} draggable={draggable} onRemove={onRemove} /></ul>)
  return onRemove
}

test('opens the game and says how much is left', () => {
  tile()
  expect(screen.getByRole('link', { name: 'Portal 2' })).toHaveAttribute('href', '/steamGame/620')
  expect(screen.getByText('67%')).toBeInTheDocument()
  expect(screen.getByText('Steam · 10 left')).toBeInTheDocument()
})

test('a finished game is marked, and its percentage turns the done colour', () => {
  tile({ earned: 30, total: 30, pct: 1 })
  expect(screen.getByText('Steam · Finished')).toBeInTheDocument()
  expect(screen.getAllByText(/100%/).some((el) => el.classList.contains('text-success'))).toBe(true)
})

test('remove, and the handle only when the list can be reordered', () => {
  const onRemove = tile(undefined, false)
  expect(screen.queryByRole('button', { name: /Drag/ })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Remove: Portal 2/ }))
  expect(onRemove).toHaveBeenCalledWith(9)
})
