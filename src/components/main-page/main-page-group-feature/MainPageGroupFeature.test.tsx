import { render, screen } from '@testing-library/react'
import MainPageGroupFeature from './MainPageGroupFeature'
import { en } from '@/translations/en'
import { useGroupDetail } from '@/hooks/useGroupDetail'
import type { GameGroup, GameGroupItem } from '@/types/types'

jest.mock('@/hooks/useGroupDetail', () => ({ useGroupDetail: jest.fn() }))

const group = (over: Partial<GameGroup> = {}): GameGroup => ({
  id: 4, title: 'Pokémon', description: null, icon: null, is_public: false, position: 0, created_at: '', updated_at: '',
  game_count: 8, steam_count: 1, total_awarded: 531, total_possible: 2691, ...over,
})
const item = (id: number, over: Partial<GameGroupItem> = {}): GameGroupItem => ({
  id, source: 'ra', game_id: 100 + id, title: `Game ${id}`, image_icon: null, console_name: 'GBA', pct_won: '0.5',
  num_awarded: 5, max_possible: 10, points_won: 0, max_points: 0, position: id, added_at: '', ...over,
})

test('names the group with its overall progress and links to it', () => {
  ;(useGroupDetail as jest.Mock).mockReturnValue({ group: { items: [] }, isLoading: false, error: false })
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.getByRole('heading', { name: 'Pokémon' })).toBeInTheDocument()
  expect(screen.getByText('20%')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: new RegExp(en.cards.viewGroup) })).toHaveAttribute('href', '/groups/4')
})

test('lists its first six games, each linking to its page, and says how many more', () => {
  const items = [...Array.from({ length: 7 }, (_, i) => item(i)), item(7, { source: 'steam', game_id: 620, title: 'Portal 2', pct_won: '1' })]
  ;(useGroupDetail as jest.Mock).mockReturnValue({ group: { items }, isLoading: false, error: false })
  render(<MainPageGroupFeature group={group()} />)
  const rows = screen.getAllByRole('listitem')
  expect(rows).toHaveLength(6)
  expect(screen.getByRole('link', { name: /Game 0/ })).toHaveAttribute('href', '/gameInfo/100')
  expect(screen.getByRole('link', { name: new RegExp(en.cards.viewGroup) })).toHaveTextContent(en.cards.moreMatches.replace('{n}', '2'))
})

test('an empty group says so', () => {
  ;(useGroupDetail as jest.Mock).mockReturnValue({ group: { items: [] }, isLoading: false, error: false })
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.getByText(en.cards.groupEmpty)).toBeInTheDocument()
})

test('a failed load is shown as an error', () => {
  ;(useGroupDetail as jest.Mock).mockReturnValue({ group: null, isLoading: false, error: true })
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.cards.groupLoadFailed)
})

test('while loading it holds the shape of the list', () => {
  ;(useGroupDetail as jest.Mock).mockReturnValue({ group: null, isLoading: true, error: false })
  const { container } = render(<MainPageGroupFeature group={group()} />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
})

test('the group’s name opens its page', () => {
  ;(useGroupDetail as jest.Mock).mockReturnValue({ group: { items: [] }, isLoading: false, error: false })
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.getByRole('link', { name: 'Pokémon' })).toHaveAttribute('href', '/groups/4')
})
