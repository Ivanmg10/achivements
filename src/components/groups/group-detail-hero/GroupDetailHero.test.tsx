import { fireEvent, render, screen } from '@testing-library/react'
import GroupDetailHero from './GroupDetailHero'
import type { GameGroup } from '@/types/types'

jest.mock('next/image', () => ({ src, alt, ...props }: React.ComponentProps<'img'>) => <img src={src as string} alt={alt} {...props} />)

const group = { id: 1, title: 'SNES platformers', description: 'The ones left', icon: null, is_public: true } as GameGroup
const props = {
  group,
  covers: ['https://a/1.png', 'https://a/2.png'],
  gameCount: 12,
  summary: { earned: 412, total: 503 },
  onAdd: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
}

test('names the group and its progress; the states of its games are for the tabs to count, not the banner', () => {
  const { container } = render(<GroupDetailHero {...props} />)
  expect(screen.getByRole('heading', { name: 'SNES platformers' })).toBeInTheDocument()
  expect(screen.getByText('The ones left')).toBeInTheDocument()
  expect(screen.getByText('Public')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: '82%' })).toBeInTheDocument()
  expect(screen.queryByText(/completed|in progress|not started/)).not.toBeInTheDocument()
  expect(container.querySelectorAll('img[src^="https://a/"]')).toHaveLength(2)
  expect(screen.getByRole('link', { name: /Back to groups/ })).toHaveAttribute('href', '/groups')
})

test('its actions', () => {
  render(<GroupDetailHero {...props} />)
  fireEvent.click(screen.getByRole('button', { name: /Add games/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Edit group' }))
  fireEvent.click(screen.getByRole('button', { name: 'Delete group' }))
  expect(props.onAdd).toHaveBeenCalled()
  expect(props.onEdit).toHaveBeenCalled()
  expect(props.onDelete).toHaveBeenCalled()
})

test('an empty group: no ring', () => {
  render(<GroupDetailHero {...props} covers={[]} gameCount={0} summary={{ earned: 0, total: 0 }} />)
  expect(screen.queryByRole('img', { name: /%/ })).not.toBeInTheDocument()
})
