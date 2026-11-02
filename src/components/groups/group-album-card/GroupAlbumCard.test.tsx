import { render, screen } from '@testing-library/react'
import GroupAlbumCard from './GroupAlbumCard'
import type { GameGroup } from '@/types/types'

jest.mock('next/image', () => ({ src, alt, ...props }: React.ComponentProps<'img'>) => <img src={src as string} alt={alt} {...props} />)

const base = {
  id: 3, title: 'October', description: null, icon: null, is_public: false, position: 0,
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  game_count: 4, steam_count: 1, psn_count: 0, xbox_count: 0, total_awarded: 103, total_possible: 176,
  completed_count: 1, started_count: 3,
  covers: [{ source: 'ra', game_id: 1, image_icon: '/Images/1.png' }, { source: 'steam', game_id: 2, image_icon: 'https://cdn/2.jpg' }],
} as GameGroup

test('opens the group and shows its covers, progress and counts', () => {
  const { container } = render(<GroupAlbumCard group={base} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/groups/3')
  expect(screen.getByText('October')).toBeInTheDocument()
  expect(screen.getByText('Private')).toBeInTheDocument()
  expect(screen.getByText('59%')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'October' })).toHaveAttribute('aria-valuenow', '59')
  expect(screen.getByText('1 completed')).toBeInTheDocument()
  expect(screen.getByText('3 in progress')).toBeInTheDocument()
  expect(screen.getByText(/103\/176 achievements/)).toBeInTheDocument()
  expect(container.querySelector('img[src="https://retroachievements.org/Images/1.png"]')).toBeInTheDocument()
  expect(container.querySelector('img[src="https://cdn/2.jpg"]')).toBeInTheDocument()
})

test('an empty group asks for games and shows no bar', () => {
  render(<GroupAlbumCard group={{ ...base, game_count: 0, steam_count: 0, total_awarded: 0, total_possible: 0, covers: [] }} />)
  expect(screen.getByText('0 games')).toBeInTheDocument()
  expect(screen.getByText('Add games')).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})
