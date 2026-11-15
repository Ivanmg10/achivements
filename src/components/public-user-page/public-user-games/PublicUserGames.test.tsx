import { render, screen, fireEvent, within } from '@testing-library/react'
import PublicUserGames from './PublicUserGames'
import type { LibraryGame } from '@/utils/library'
import { en } from '@/translations/en'

jest.mock('../public-user-game-row/PublicUserGameRow', () => ({
  __esModule: true,
  default: ({ game }: { game: LibraryGame }) => <span>{game.title}</span>,
}))

const game = (key: string, title: string, pct: number): LibraryGame => {
  const [source, id] = key.split(':')
  return { key, source: source as LibraryGame['source'], id: Number(id), title, subtitle: '', status: pct >= 100 ? 'completed' : 'playing', pct, href: '' }
}
const GAMES = [game('ra:1', 'Zelda', 40), game('steam:2', 'Portal', 100), game('psn:3', 'Astro', 70)]
const titles = () => screen.getAllByRole('listitem').map((li) => li.textContent)

test('furthest along first, or by name', () => {
  render(<PublicUserGames games={GAMES} isLoading={false} />)
  expect(titles()).toEqual(['Portal', 'Astro', 'Zelda'])
  fireEvent.click(screen.getByRole('combobox', { name: en.userProfile.sortBy }))
  fireEvent.click(screen.getByRole('option', { name: en.userProfile.sortName }))
  expect(titles()).toEqual(['Astro', 'Portal', 'Zelda'])
})

test('filters by platform, state and title, and counts what is left', () => {
  render(<PublicUserGames games={GAMES} isLoading={false} />)
  fireEvent.click(screen.getByRole('button', { name: 'Steam' }))
  expect(titles()).toEqual(['Portal'])
  expect(screen.getByRole('button', { name: 'Steam' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(within(screen.getByRole('group', { name: en.userProfile.platformFilter })).getByRole('button', { name: en.userProfile.allPlatforms }))
  fireEvent.click(screen.getByRole('button', { name: en.userProfile.playing }))
  expect(titles()).toEqual(['Astro', 'Zelda'])
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zel' } })
  expect(titles()).toEqual(['Zelda'])
  expect(screen.getByRole('status')).toHaveTextContent(en.userProfile.gamesCount.replace('{n}', '1'))
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nothing like it' } })
  expect(screen.getByText(en.userProfile.noGamesMatch)).toBeInTheDocument()
})

test('a long list comes thirty at a time', () => {
  const many = Array.from({ length: 45 }, (_, i) => game(`ra:${i + 1}`, `Game ${i}`, i))
  render(<PublicUserGames games={many} isLoading={false} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(30)
  fireEvent.click(screen.getByRole('button', { name: en.userProfile.showMore.replace('{n}', '15') }))
  expect(screen.getAllByRole('listitem')).toHaveLength(45)
})

test('one platform needs no platform filter', () => {
  render(<PublicUserGames games={[GAMES[0]]} isLoading={false} />)
  expect(screen.queryByRole('group', { name: en.userProfile.platformFilter })).not.toBeInTheDocument()
})

test('says so with no games, and while loading', () => {
  const { unmount } = render(<PublicUserGames games={[]} isLoading={false} />)
  expect(screen.getByText(en.userProfile.noGames)).toBeInTheDocument()
  unmount()
  render(<PublicUserGames games={[]} isLoading />)
  expect(screen.getByText(en.userProfile.loadingGames)).toBeInTheDocument()
})
