import { render, screen, fireEvent, within } from '@testing-library/react'
import MainPagePinnedSectionShowcase from './MainPagePinnedSectionShowcase'
import { useOwnShowcase } from '@/context/ShowcaseContext'
import { useActivityHeatmapYear } from '@/context/ActivityHeatmapYearContext'
import { en } from '@/translations/en'

jest.mock('@/context/ShowcaseContext', () => ({ useOwnShowcase: jest.fn() }))
jest.mock('@/context/ActivityHeatmapYearContext', () => ({ useActivityHeatmapYear: jest.fn() }))

const item = (k: string, id: number) => ({
  id, source: 'ra', gameId: 1, achievementKey: k, gameTitle: 'Zelda', title: `Logro ${k}`, description: null, badge: null, earnedAt: '2026-10-01T00:00:00.000Z',
})
const remove = jest.fn()
const add = jest.fn()
const setup = (items: ReturnType<typeof item>[], over: Record<string, unknown> = {}) =>
  (useOwnShowcase as jest.Mock).mockReturnValue({
    items, isLoading: false, error: false, retry: jest.fn(), remove, add, reorder: jest.fn(), full: items.length >= 5, has: () => false, ...over,
  })

beforeEach(() => {
  jest.clearAllMocks()
  ;(useActivityHeatmapYear as jest.Mock).mockReturnValue({
    achievements: [{ Date: '2026-09-01 10:00:00', AchievementID: 42, Title: 'Sin daños', Description: '', BadgeName: '', GameID: 3, GameTitle: 'Super Metroid', HardcoreMode: '1', Points: 5, ConsoleName: 'SNES' }],
  })
})

test('the showcase, then an empty slot for each free place', () => {
  setup([item('1', 1), item('2', 2)])
  render(<MainPagePinnedSectionShowcase />)
  expect(screen.getByRole('heading', { name: en.showcase.title })).toBeInTheDocument()
  expect(screen.getByText('Logro 1')).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: en.showcase.addSlot })).toHaveLength(3)
  fireEvent.click(screen.getByRole('button', { name: `${en.showcase.remove}: Logro 1` }))
  expect(remove).toHaveBeenCalledWith(item('1', 1))
})

test('a free slot opens the picker of the year’s achievements, which adds one', async () => {
  setup([])
  render(<MainPagePinnedSectionShowcase />)
  fireEvent.click(screen.getAllByRole('button', { name: en.showcase.addSlot })[0])
  const dialog = await screen.findByRole('dialog', { name: en.showcase.pickerTitle })
  fireEvent.click(within(dialog).getByRole('button', { name: /Sin daños/ }))
  expect(add).toHaveBeenCalledWith(expect.objectContaining({ source: 'ra', achievementKey: '42', gameTitle: 'Super Metroid' }))
  fireEvent.change(within(dialog).getByLabelText(en.showcase.pickerSearch), { target: { value: 'zzz' } })
  expect(within(dialog).getByRole('status')).toHaveTextContent(en.showcase.pickerNoMatch)
})

test('full: no empty slot', () => {
  setup(['1', '2', '3', '4', '5'].map((k, i) => item(k, i + 1)))
  render(<MainPagePinnedSectionShowcase />)
  expect(screen.queryByRole('button', { name: en.showcase.addSlot })).not.toBeInTheDocument()
  expect(screen.getByText(en.showcase.count.replace('{n}', '5'))).toBeInTheDocument()
})
