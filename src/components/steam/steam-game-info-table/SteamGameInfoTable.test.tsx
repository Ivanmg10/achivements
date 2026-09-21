import { render, screen, fireEvent, within, act } from '@testing-library/react'
import SteamGameInfoTable from './SteamGameInfoTable'
import { en } from '@/translations/en'
import type { SteamAchievementUnified } from '@/types/steam'

function ach(apiname: string, overrides: Partial<SteamAchievementUnified> = {}): SteamAchievementUnified {
  return {
    _source: 'steam',
    id: apiname,
    apiname,
    title: apiname,
    description: `${apiname} desc`,
    earned: false,
    dateEarned: null,
    badgeUrl: `${apiname}.jpg`,
    displayOrder: 0,
    hidden: false,
    globalPct: null,
    ...overrides,
  }
}

const LIST = [
  ach('FIRST', { displayOrder: 0, globalPct: 80, earned: true, dateEarned: '2024-01-01T12:00:00.000Z' }),
  ach('SECOND', { displayOrder: 1, globalPct: 5 }),
  ach('THIRD', { displayOrder: 2, globalPct: 40, earned: true, dateEarned: '2024-06-01T12:00:00.000Z' }),
  ach('FOURTH', { displayOrder: 3 }),
]

/** The filter buttons, apart from the column headers that can share a name ("Earned"). */
const filters = () => within(screen.getByRole('group'))
const header = () => within(screen.getByRole('table').querySelector('thead')!)

/** Titles in the desktop table's row order. */
function rowOrder() {
  const table = screen.getByRole('table')
  return within(table).getAllByRole('row').slice(1).map((r) => within(r).getByRole('heading').textContent)
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

test('lists every achievement in Steam order by default', () => {
  render(<SteamGameInfoTable achievements={LIST} />)
  expect(rowOrder()).toEqual(['FIRST', 'SECOND', 'THIRD', 'FOURTH'])
})

test('renders a card list for phones alongside the desktop table', () => {
  render(<SteamGameInfoTable achievements={LIST} />)
  const cards = screen.getAllByRole('listitem')
  expect(cards).toHaveLength(4)
})

describe('filter', () => {
  test('shows earned or unearned only, marking the active choice without colour alone', () => {
    render(<SteamGameInfoTable achievements={LIST} />)
    const earnedButton = filters().getByRole('button', { name: en.gameInfoTable.filterEarned })

    fireEvent.click(earnedButton)
    expect(earnedButton.getAttribute('aria-pressed')).toBe('true')
    expect(rowOrder()).toEqual(['FIRST', 'THIRD'])

    fireEvent.click(filters().getByRole('button', { name: en.gameInfoTable.filterUnearned }))
    expect(rowOrder()).toEqual(['SECOND', 'FOURTH'])

    fireEvent.click(filters().getByRole('button', { name: en.gameInfoTable.filterAll }))
    expect(rowOrder()).toHaveLength(4)
  })

  test('says so when a filter leaves nothing', () => {
    render(<SteamGameInfoTable achievements={[ach('A')]} />)
    fireEvent.click(filters().getByRole('button', { name: en.gameInfoTable.filterEarned }))
    expect(screen.getByText(en.steam.noAchievements)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('sorting', () => {
  test('by rarity puts the rarest first, unknown rarity last, and reverses on a second click', () => {
    render(<SteamGameInfoTable achievements={LIST} />)
    const rarity = header().getByRole('button', { name: en.gameInfoTable.headerRarity })

    fireEvent.click(rarity)
    expect(rowOrder()).toEqual(['SECOND', 'THIRD', 'FIRST', 'FOURTH'])
    expect(rarity.closest('th')?.getAttribute('aria-sort')).toBe('ascending')

    fireEvent.click(rarity)
    expect(rarity.closest('th')?.getAttribute('aria-sort')).toBe('descending')
    expect(rowOrder()[0]).toBe('FOURTH')
  })

  test('by unlock date puts the newest first and keeps locked ones last', () => {
    render(<SteamGameInfoTable achievements={LIST} />)
    const earned = header().getByRole('button', { name: en.gameInfoTable.headerEarned })

    fireEvent.click(earned)
    expect(rowOrder()).toEqual(['THIRD', 'FIRST', 'SECOND', 'FOURTH'])

    fireEvent.click(earned)
    expect(rowOrder().slice(0, 2)).toEqual(['FIRST', 'THIRD'])
  })

  test('only the active column reports an order', () => {
    render(<SteamGameInfoTable achievements={LIST} />)
    fireEvent.click(header().getByRole('button', { name: en.gameInfoTable.headerRarity }))
    const order = header().getByRole('button', { name: en.gameInfoTable.headerAchievement })
    expect(order.closest('th')?.getAttribute('aria-sort')).toBe('none')
  })

  test('back to Steam order from the achievement column', () => {
    render(<SteamGameInfoTable achievements={LIST} />)
    fireEvent.click(header().getByRole('button', { name: en.gameInfoTable.headerRarity }))
    fireEvent.click(header().getByRole('button', { name: en.gameInfoTable.headerAchievement }))
    expect(rowOrder()).toEqual(['FIRST', 'SECOND', 'THIRD', 'FOURTH'])
  })
})

test('folds to the first rows and unfolds again', () => {
  render(<SteamGameInfoTable achievements={LIST} />)
  const toggle = screen.getByRole('button', { name: en.gameInfoTable.collapseTable })
  expect(toggle.getAttribute('aria-expanded')).toBe('true')

  fireEvent.click(toggle)
  expect(rowOrder()).toHaveLength(3)
  fireEvent.click(screen.getByRole('button', { name: `${en.gameInfoTable.expandTable} (4)` }))
  expect(rowOrder()).toHaveLength(4)
})

test('offers no fold for a short list', () => {
  render(<SteamGameInfoTable achievements={LIST.slice(0, 3)} />)
  expect(screen.queryByRole('button', { name: en.gameInfoTable.collapseTable })).not.toBeInTheDocument()
})

describe('opened from a badge link', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  test('highlights the linked achievement, then lets it fade', () => {
    window.history.replaceState(null, '', '/steamGame/620#ach-THIRD')
    render(<SteamGameInfoTable achievements={LIST} />)

    const row = screen.getByRole('table').querySelector('[data-ach="THIRD"]')!
    expect(row.className).toContain('bg-[#66c0f4]/15')

    act(() => { jest.advanceTimersByTime(2500) })
    expect(row.className).not.toContain('bg-[#66c0f4]/15')
  })

  test('unfolds and clears the filter so the achievement is visible', () => {
    window.history.replaceState(null, '', '/steamGame/620#ach-FOURTH')
    render(<SteamGameInfoTable achievements={LIST} />)
    expect(rowOrder()).toContain('FOURTH')
  })

  test('ignores a link to an achievement the game does not have', () => {
    window.history.replaceState(null, '', '/steamGame/620#ach-NOPE')
    render(<SteamGameInfoTable achievements={LIST} />)
    expect(screen.getByRole('table').querySelector('.bg-\\[\\#66c0f4\\]\\/15')).toBeNull()
  })

  test('ignores unrelated hashes', () => {
    window.history.replaceState(null, '', '/steamGame/620#comments')
    render(<SteamGameInfoTable achievements={LIST} />)
    expect(screen.getByRole('table').querySelector('.bg-\\[\\#66c0f4\\]\\/15')).toBeNull()
  })
})
