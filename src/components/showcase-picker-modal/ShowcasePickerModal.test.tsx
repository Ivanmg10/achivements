import { render, screen, fireEvent, within } from '@testing-library/react'
import ShowcasePickerModal from './ShowcasePickerModal'
import { useOwnShowcase } from '@/context/ShowcaseContext'
import { useProfileLibrary } from '@/hooks/useProfileLibrary'
import { useShowcaseGameChoices } from '@/hooks/useShowcaseGameChoices'
import { en } from '@/translations/en'
import { showcaseChoices } from '@/utils/showcase'

jest.mock('@/context/ShowcaseContext', () => ({ useOwnShowcase: jest.fn() }))
jest.mock('@/context/ActivityHeatmapYearContext', () => ({
  useActivityHeatmapYear: () => ({ achievements: [{ Date: '2026-10-10 10:00:00', GameID: 2, Source: undefined }] }),
}))
jest.mock('@/hooks/useProfileLibrary', () => ({ useProfileLibrary: jest.fn() }))
jest.mock('@/hooks/useShowcaseGameChoices', () => ({ useShowcaseGameChoices: jest.fn() }))

const game = (id: number, title: string, pct: number, source = 'ra') => ({ key: `${source}:${id}`, source, id, title, subtitle: 'SNES', status: 'playing', pct, href: '' })
const choicesOf = (gameId: number, title: string) =>
  showcaseChoices('ra', gameId, title, [
    { key: `${gameId}1`, title: `${title} won`, earnedAt: '2026-10-01T00:00:00Z' },
    { key: `${gameId}2`, title: `${title} won too`, earnedAt: '2026-09-01T00:00:00Z' },
    { key: `${gameId}3`, title: `${title} locked`, earnedAt: null },
  ])
const addMany = jest.fn()
const row = (name: RegExp) => within(screen.getByRole('list', { name: en.showcase.gamesLabel })).getByRole('button', { name })
const setup = (inShowcase = 0) =>
  (useOwnShowcase as jest.Mock).mockReturnValue({
    items: Array.from({ length: inShowcase }, (_, i) => ({ id: i + 1, source: 'ra', gameId: 90 + i, achievementKey: `k${i}`, title: `Held ${i}`, badge: null })),
    has: () => false,
    addMany,
  })

beforeEach(() => {
  jest.clearAllMocks()
  ;(useProfileLibrary as jest.Mock).mockReturnValue({ games: [game(1, 'Zelda', 40), game(2, 'Metroid', 10), game(3, 'Untouched', 0)], isLoading: false })
  ;(useShowcaseGameChoices as jest.Mock).mockImplementation((g) =>
    g ? { choices: choicesOf(g.id, g.title), isLoading: false, error: false, retry: jest.fn() } : { choices: [], isLoading: false, error: false, retry: jest.fn() },
  )
})

test('games with something earned, the one played this year first; a game opens its achievements, earned selectable, the rest greyed', () => {
  setup()
  render(<ShowcasePickerModal isOpen onClose={jest.fn()} />)
  const games = within(screen.getByRole('list', { name: en.showcase.gamesLabel })).getAllByRole('button')
  expect(games.map((b) => b.textContent)).toEqual([expect.stringContaining('Metroid'), expect.stringContaining('Zelda')])

  fireEvent.click(games[0])
  expect(screen.getByRole('heading', { name: 'Metroid' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: `Metroid locked · ${en.showcase.notEarned}` })).toBeDisabled()
  const won = screen.getByRole('button', { name: 'Metroid won' })
  fireEvent.click(won)
  expect(won).toHaveAttribute('aria-pressed', 'true')
})

test('the selection spans games: back to the list, the game says how many; add them all at once', () => {
  setup()
  const onClose = jest.fn()
  render(<ShowcasePickerModal isOpen onClose={onClose} />)
  fireEvent.click(row(/Metroid/))
  fireEvent.click(screen.getByRole('button', { name: 'Metroid won' }))
  fireEvent.click(screen.getByRole('button', { name: en.showcase.back }))

  expect(row(/Metroid/)).toHaveTextContent(en.showcase.selected.replace('{n}', '1'))
  fireEvent.click(row(/Zelda/))
  fireEvent.click(screen.getByRole('button', { name: 'Zelda won too' }))
  expect(screen.getByRole('status')).toHaveTextContent(en.showcase.selected.replace('{n}', '2'))

  fireEvent.click(screen.getByRole('button', { name: en.showcase.addSelected }))
  expect(addMany).toHaveBeenCalledWith([
    expect.objectContaining({ gameId: 2, achievementKey: '21' }),
    expect.objectContaining({ gameId: 1, achievementKey: '12' }),
  ])
})

test('never more than fits: with 4 in the showcase, one can be selected and the rest wait', () => {
  setup(4)
  render(<ShowcasePickerModal isOpen onClose={jest.fn()} />)
  fireEvent.click(row(/Zelda/))
  fireEvent.click(screen.getByRole('button', { name: 'Zelda won' }))
  expect(screen.getByRole('button', { name: 'Zelda won too' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent(en.showcase.noSlots)
  // Unselecting frees the place again.
  fireEvent.click(screen.getByRole('button', { name: 'Zelda won' }))
  expect(screen.getByRole('button', { name: 'Zelda won too' })).toBeEnabled()
})

test('each achievement says what it asks for (shown on hover), but a hidden one not earned gives nothing away', () => {
  setup()
  ;(useShowcaseGameChoices as jest.Mock).mockReturnValue({
    choices: showcaseChoices('ra', 2, 'Metroid', [
      { key: '1', title: 'Fast', description: 'Beat it under 3 hours', earnedAt: '2026-10-01T00:00:00Z' },
      { key: '2', title: 'Secret', description: 'Spoiler', earnedAt: null, hidden: true },
    ]),
    isLoading: false,
    error: false,
    retry: jest.fn(),
  })
  render(<ShowcasePickerModal isOpen onClose={jest.fn()} />)
  fireEvent.click(row(/Metroid/))
  expect(screen.getByRole('button', { name: 'Fast' })).toHaveAccessibleDescription('Beat it under 3 hours')
  expect(screen.queryByText('Spoiler')).not.toBeInTheDocument()
})

test('before a game is chosen the right pane says what to do; the open game is marked in the list', () => {
  setup()
  render(<ShowcasePickerModal isOpen onClose={jest.fn()} />)
  expect(screen.getByText(en.showcase.pickGame)).toBeInTheDocument()
  fireEvent.click(row(/Zelda/))
  expect(screen.queryByText(en.showcase.pickGame)).not.toBeInTheDocument()
  expect(row(/Zelda/)).toHaveAttribute('aria-current', 'true')
  expect(row(/Metroid/)).not.toHaveAttribute('aria-current')
})

test('a game row has its full title, its platform name and its percentage', () => {
  setup()
  render(<ShowcasePickerModal isOpen onClose={jest.fn()} />)
  expect(row(/Zelda/)).toHaveTextContent('40%')
  expect(row(/Zelda/)).toHaveTextContent('RetroAchievements')
})

test('the platform chips filter the games, and only show when there is more than one platform', () => {
  setup()
  const { unmount } = render(<ShowcasePickerModal isOpen onClose={jest.fn()} />)
  expect(screen.queryByRole('group', { name: en.showcase.platformFilter })).not.toBeInTheDocument()
  unmount()

  ;(useProfileLibrary as jest.Mock).mockReturnValue({ games: [game(1, 'Zelda', 40), game(7, 'Portal', 60, 'steam')], isLoading: false })
  render(<ShowcasePickerModal isOpen onClose={jest.fn()} />)
  const chips = screen.getByRole('group', { name: en.showcase.platformFilter })
  fireEvent.click(within(chips).getByRole('button', { name: /Steam/ }))
  expect(within(screen.getByRole('list', { name: en.showcase.gamesLabel })).getAllByRole('button')).toHaveLength(1)
  expect(row(/Portal/)).toBeInTheDocument()
  fireEvent.click(within(chips).getByRole('button', { name: new RegExp(en.libraryFilters.all) }))
  expect(within(screen.getByRole('list', { name: en.showcase.gamesLabel })).getAllByRole('button')).toHaveLength(2)
})

test('the footer draws the places: what the showcase holds is taken, a pick fills a place and can be taken out', () => {
  setup(2)
  render(<ShowcasePickerModal isOpen onClose={jest.fn()} />)
  const slots = screen.getByRole('list', { name: en.showcase.slotsLabel })
  expect(within(slots).getAllByRole('img')).toHaveLength(2)
  expect(within(slots).getByRole('img', { name: `Held 0 · ${en.showcase.inShowcase}` })).toBeInTheDocument()
  expect(within(slots).getAllByRole('button', { name: en.showcase.addSlot })).toHaveLength(3)

  fireEvent.click(row(/Zelda/))
  fireEvent.click(screen.getByRole('button', { name: 'Zelda won' }))
  expect(within(slots).getAllByRole('button', { name: en.showcase.addSlot })).toHaveLength(2)
  fireEvent.click(within(slots).getByRole('button', { name: en.showcase.removePick.replace('{title}', 'Zelda won') }))
  expect(screen.getByRole('button', { name: 'Zelda won' })).toHaveAttribute('aria-pressed', 'false')
  expect(within(slots).getAllByRole('button', { name: en.showcase.addSlot })).toHaveLength(3)
})

test('an empty place goes back to the games', () => {
  setup()
  render(<ShowcasePickerModal isOpen onClose={jest.fn()} />)
  fireEvent.click(row(/Zelda/))
  fireEvent.click(within(screen.getByRole('list', { name: en.showcase.slotsLabel })).getAllByRole('button', { name: en.showcase.addSlot })[0])
  expect(screen.getByText(en.showcase.pickGame)).toBeInTheDocument()
})

test('while the library loads, the list is a skeleton on the real boxes', () => {
  setup()
  ;(useProfileLibrary as jest.Mock).mockReturnValue({ games: [], isLoading: true })
  const { container } = render(<ShowcasePickerModal isOpen onClose={jest.fn()} />)
  expect(document.body.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  expect(screen.queryByRole('list', { name: en.showcase.gamesLabel })).not.toBeInTheDocument()
  expect(container).toBeEmptyDOMElement()
})
