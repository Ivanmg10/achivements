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

const game = (id: number, title: string, pct: number) => ({ key: `ra:${id}`, source: 'ra', id, title, subtitle: 'SNES', status: 'playing', pct, href: '' })
const choicesOf = (gameId: number, title: string) =>
  showcaseChoices('ra', gameId, title, [
    { key: `${gameId}1`, title: `${title} won`, earnedAt: '2026-10-01T00:00:00Z' },
    { key: `${gameId}2`, title: `${title} won too`, earnedAt: '2026-09-01T00:00:00Z' },
    { key: `${gameId}3`, title: `${title} locked`, earnedAt: null },
  ])
const addMany = jest.fn()
const setup = (inShowcase = 0) =>
  (useOwnShowcase as jest.Mock).mockReturnValue({
    items: Array.from({ length: inShowcase }, (_, i) => ({ id: i + 1 })),
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
  fireEvent.click(screen.getByRole('button', { name: /Metroid/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Metroid won' }))
  fireEvent.click(screen.getByRole('button', { name: en.showcase.back }))

  expect(screen.getByRole('button', { name: /Metroid/ })).toHaveTextContent(en.showcase.selected.replace('{n}', '1'))
  fireEvent.click(screen.getByRole('button', { name: /Zelda/ }))
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
  fireEvent.click(screen.getByRole('button', { name: /Zelda/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Zelda won' }))
  expect(screen.getByRole('button', { name: 'Zelda won too' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent(en.showcase.noSlots)
  // Unselecting frees the place again.
  fireEvent.click(screen.getByRole('button', { name: 'Zelda won' }))
  expect(screen.getByRole('button', { name: 'Zelda won too' })).toBeEnabled()
})
