import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SortableItem from './SortableItem'

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

const mockT = {
  statusGameItem: { noPublishedAchievements: 'No achievements' },
  achievement: { notEarned: 'Not earned' },
}
jest.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ T: mockT }),
}))

jest.mock('next/image', () => ({ src, alt, ...props }: any) => (
  <img src={src} alt={alt} {...props} />
))

jest.mock('next/link', () => ({ children, ...props }: any) => (
  <a {...props}>{children}</a>
))

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
  })
) as jest.Mock

const baseItem = {
  id: 1,
  game_id: 100,
  title: 'Test Game',
  image_icon: '/image/icon.png',
  console_name: 'NES',
  pct_won: '0.5',
  num_awarded: 50,
  max_possible: 100,
  points_won: 50,
  max_points: 500,
  added_at: new Date().toISOString(),
}

describe('SortableItem', () => {
  it('renders game title and progress', () => {
    render(
      <SortableItem
        item={baseItem as any}
        onRemove={jest.fn()}
        draggable={false}
      />
    )
    expect(screen.getByText('Test Game')).toBeInTheDocument()
    expect(screen.getByText('NES')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('renders drag handle when draggable is true', () => {
    render(
      <SortableItem
        item={baseItem as any}
        onRemove={jest.fn()}
        draggable={true}
      />
    )
    expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument()
  })

  it('does not render drag handle when draggable is false', () => {
    render(
      <SortableItem
        item={baseItem as any}
        onRemove={jest.fn()}
        draggable={false}
      />
    )
    expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument()
  })

  it('renders fallback for missing image_icon', () => {
    const item = { ...baseItem, image_icon: '' }
    const { container } = render(
      <SortableItem
        item={item as any}
        onRemove={jest.fn()}
        draggable={false}
      />
    )
    expect(container.querySelector('.bg-bg-main')).toBeInTheDocument()
  })

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = jest.fn()
    render(
      <SortableItem
        item={baseItem as any}
        onRemove={onRemove}
        draggable={false}
      />
    )
    const removeBtn = screen.getByLabelText('Remove game')
    fireEvent.click(removeBtn)
    expect(onRemove).toHaveBeenCalledWith(1)
  })
})
