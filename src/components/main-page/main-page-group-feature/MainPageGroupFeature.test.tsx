import { fireEvent, render, screen, within } from '@testing-library/react'
import MainPageGroupFeature from './MainPageGroupFeature'
import { en } from '@/translations/en'
import { useGroupDetail } from '@/hooks/useGroupDetail'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { notify } from '@/lib/notify'
import { waitFor } from '@testing-library/react'
import type { GameGroup, GameGroupItem } from '@/types/types'

jest.mock('@/hooks/useGroupDetail', () => ({ useGroupDetail: jest.fn() }))
jest.mock('@/context/GamesDataContext', () => ({ useGamesData: () => ({ all: [] }) }))
jest.mock('@/hooks/useRecentlyPlayedGames', () => ({ useRecentlyPlayedGames: () => ({ games: [] }) }))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: jest.fn() }))
jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)
jest.mock('@/lib/notify', () => ({ notify: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/components/groups/GroupModal', () => ({
  __esModule: true,
  default: ({ group, onSave }: { group: { title: string }; onSave: (d: unknown) => Promise<void> }) => (
    <button data-testid="edit-modal" onClick={() => onSave({ title: 'Renamed', description: '', icon: '', is_public: true })}>{group.title}</button>
  ),
}))
jest.mock('@/components/groups/add-game-modal/AddGameModal', () => ({
  __esModule: true,
  default: ({ groupTitle }: { groupTitle: string }) => <div data-testid="add-modal">{groupTitle}</div>,
}))

const group = (over: Partial<GameGroup> = {}): GameGroup => ({
  id: 4, title: 'Pokémon', description: null, icon: null, is_public: false, position: 0, created_at: '', updated_at: '',
  game_count: 8, steam_count: 1, psn_count: 0, total_awarded: 531, total_possible: 2691, ...over,
})
const item = (id: number, over: Partial<GameGroupItem> = {}): GameGroupItem => ({
  id, source: 'ra', game_id: 100 + id, title: `Game ${id}`, image_icon: null, console_name: 'GBA', pct_won: '0.5',
  num_awarded: 5, max_possible: 10, points_won: 0, max_points: 0, position: id, added_at: '', ...over,
})
const detail = (items: GameGroupItem[]) => (useGroupDetail as jest.Mock).mockReturnValue({ group: { items }, isLoading: false, error: false })

beforeEach(() => {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ library: [] })
})

test('names the group with its stored progress until its games are read, and links to it', () => {
  ;(useGroupDetail as jest.Mock).mockReturnValue({ group: null, isLoading: true, error: false })
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.getByRole('heading', { name: 'Pokémon' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: '20%' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: new RegExp(en.cards.viewGroup) })).toHaveAttribute('href', '/groups/4')
})

test('reads progress like the group page: a Steam game from the live library', () => {
  ;(useSteamGamesData as jest.Mock).mockReturnValue({ library: [{ id: 620, achievementsLoaded: true, maxPossible: 10, numAwarded: 10 }] })
  detail([item(1), item(2, { source: 'steam', game_id: 620, title: 'Portal 2', pct_won: '0', num_awarded: 0 })])
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.getByRole('img', { name: '75%' })).toBeInTheDocument()
  expect(screen.getByText('1 completed')).toBeInTheDocument()
  expect(screen.getByText('1 in progress')).toBeInTheDocument()
  expect(within(screen.getByRole('link', { name: /Portal 2/ })).getByText('100%')).toHaveClass('text-success')
})

test('points to the game closest to done', () => {
  detail([item(1, { pct_won: '0.5' }), item(2, { pct_won: '0.9', num_awarded: 9, title: 'Kirby' })])
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.getByRole('link', { name: /1 left in Kirby/ })).toHaveAttribute('href', '/gameInfo/102')
})

test('a big group: its first eleven games as covers, each linking to its page, and a tile with the rest', () => {
  detail(Array.from({ length: 14 }, (_, i) => item(i)))
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.getAllByRole('link', { name: /^Game \d/ })).toHaveLength(11)
  expect(screen.getByRole('link', { name: /^Game 0/ })).toHaveAttribute('href', '/gameInfo/100')
  expect(screen.getByRole('link', { name: '+3 more' })).toHaveAttribute('href', '/groups/4')
})

test('a small group has no "more" tile', () => {
  detail([item(1), item(2)])
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.queryByRole('link', { name: /more$/ })).not.toBeInTheDocument()
})

test('an empty group says so and can be filled from here', async () => {
  detail([])
  render(<MainPageGroupFeature group={group({ total_possible: 0, total_awarded: 0, game_count: 0 })} />)
  expect(screen.getByText(en.cards.groupEmpty)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.groups.addGames }))
  expect(await screen.findByTestId('add-modal')).toHaveTextContent('Pokémon')
})

test('a failed load is shown as an error', () => {
  ;(useGroupDetail as jest.Mock).mockReturnValue({ group: null, isLoading: false, error: true })
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.getByRole('alert')).toHaveTextContent(en.cards.groupLoadFailed)
})

test('while loading it holds the shape of the covers', () => {
  ;(useGroupDetail as jest.Mock).mockReturnValue({ group: null, isLoading: true, error: false })
  const { container } = render(<MainPageGroupFeature group={group()} />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
})

test('a PSN game links to its PSN page', () => {
  detail([item(1, { source: 'psn', game_id: 2018800, title: 'Astro Bot', image_icon: 'https://psn/a.png', console_name: 'PlayStation' })])
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.getByRole('link', { name: /^Astro Bot/ })).toHaveAttribute('href', '/psnGame/NPWR20188_00')
})

test('the group can be edited from here, and saving says so', async () => {
  detail([item(1)])
  const onEdit = jest.fn().mockResolvedValue({})
  render(<MainPageGroupFeature group={group()} onEdit={onEdit} />)
  fireEvent.click(screen.getByRole('button', { name: en.groups.editGroup }))
  fireEvent.click(await screen.findByTestId('edit-modal'))
  await waitFor(() => expect(onEdit).toHaveBeenCalledWith({ title: 'Renamed', description: undefined, icon: undefined, is_public: true }))
  await waitFor(() => expect(notify.success).toHaveBeenCalledWith(en.toast.groupSaved))
})

test('no edit button without a way to save', () => {
  detail([item(1)])
  render(<MainPageGroupFeature group={group()} />)
  expect(screen.queryByRole('button', { name: en.groups.editGroup })).not.toBeInTheDocument()
})
