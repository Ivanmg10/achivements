import { render, screen } from '@testing-library/react'
import GroupShelfRow from './GroupShelfRow'
import type { GameGroup } from '@/types/types'

jest.mock('next/image', () => ({ src, alt, ...props }: React.ComponentProps<'img'>) => <img src={src as string} alt={alt} {...props} />)

const base = {
  id: 3, title: 'October', description: null, icon: null, is_public: true, position: 0,
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  game_count: 2, steam_count: 1, psn_count: 0, xbox_count: 0, total_awarded: 30, total_possible: 60,
  covers: [
    { source: 'ra', game_id: 1, image_icon: '/Images/1.png', title: 'Zelda', num_awarded: 30, max_possible: 30 },
    { source: 'steam', game_id: 620, image_icon: 'https://cdn/620.jpg', title: 'Portal 2', num_awarded: 0, max_possible: 30 },
  ],
  next_up: { title: 'Zelda', left: 4 },
} as GameGroup

test('each game opens its own page, with its progress', () => {
  render(<GroupShelfRow group={base} />)
  expect(screen.getByRole('link', { name: /Zelda/ })).toHaveAttribute('href', '/gameInfo/1')
  expect(screen.getByRole('link', { name: /Portal 2/ })).toHaveAttribute('href', '/steamGame/620')
  expect(screen.getByText('100%')).toHaveClass('text-success')
})

test('the title opens the group and the closest game is named', () => {
  render(<GroupShelfRow group={base} />)
  expect(screen.getByRole('link', { name: 'October' })).toHaveAttribute('href', '/groups/3')
  expect(screen.getByText('4 left in Zelda')).toBeInTheDocument()
})

test('the last tile shows how many more there are, or asks for games', () => {
  const { rerender } = render(<GroupShelfRow group={{ ...base, game_count: 9 }} />)
  expect(screen.getByRole('link', { name: '+7 more' })).toHaveAttribute('href', '/groups/3')
  rerender(<GroupShelfRow group={{ ...base, game_count: 0, covers: [], next_up: null }} />)
  expect(screen.getByRole('link', { name: /Add games/ })).toHaveAttribute('href', '/groups/3')
  expect(screen.queryByText('Closest to done')).not.toBeInTheDocument()
})
