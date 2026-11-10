jest.mock('@/hooks/useRaFavoriteIds', () => ({ useRaFavoriteIds: jest.fn() }))

import { fireEvent, render, screen, within } from '@testing-library/react'
import GameInfoTable from './GameInfoTable'
import { en } from '@/translations/en'
import { useRaFavoriteIds } from '@/hooks/useRaFavoriteIds'

// What every platform's table does is in AchievementTable.contract.test.tsx; this is RA's own.

const achievement = (ID: number, overrides: object = {}) => ({
  ID, Title: `Ach ${ID}`, Description: 'Do it', BadgeName: 'b', Points: 10, TrueRatio: 15, NumAwarded: 50, NumAwardedHardcore: 20,
  DateEarned: null, DateEarnedHardcore: null, Author: 'a', AuthorULID: 'u', DateModified: '', DateCreated: '', DisplayOrder: ID, MemAddr: '',
  ...overrides,
})
const game = (...list: ReturnType<typeof achievement>[]) => ({ ID: 1, Title: 'Game', NumDistinctPlayers: 100, Achievements: Object.fromEntries(list.map((a) => [a.ID, a])) }) as never

const names = () => within(screen.getByRole('table')).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

beforeEach(() => {
  ;(useRaFavoriteIds as jest.Mock).mockReturnValue({ favoritedIds: new Set(), leadingIds: new Set(), toggleFavorite: jest.fn() })
})

test('a game with no achievements, or none read yet, says so, with no filters or table', () => {
  render(<GameInfoTable gameData={game()} />)
  expect(screen.getByText(en.statusGameItem.noPublishedAchievements)).toBeInTheDocument()
  expect(screen.queryByRole('group')).not.toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

test('in RA order, each with its type beside the name, the star beside it too', () => {
  render(<GameInfoTable gameData={game(achievement(2, { Type: 'missable' }), achievement(1, { Type: 'win_condition' }))} />)
  expect(names()).toEqual(['Ach 1', 'Ach 2'])
  const second = screen.getAllByRole('row')[2]
  expect(within(second).getByText(en.achievement.missable)).toBeInTheDocument()
  expect(within(second).getByRole('button', { name: `${en.favorites.addFavorite}: Ach 2` })).toBeInTheDocument()
})

test('earned in hardcore or softcore, said beside the date', () => {
  render(<GameInfoTable gameData={game(achievement(1, { DateEarned: '2026-01-01 10:00:00', DateEarnedHardcore: '2026-01-01 10:00:00' }), achievement(2, { DateEarned: '2026-01-02 10:00:00' }))} />)
  expect(within(screen.getAllByRole('row')[1]).getByText(new RegExp(`^${en.categoryPage.hardcore} ·`))).toBeInTheDocument()
  expect(within(screen.getAllByRole('row')[2]).getByText(new RegExp(`^${en.categoryPage.softcore} ·`))).toBeInTheDocument()
})

test('players, hardcore players and points are columns; points and players sort most first', () => {
  render(<GameInfoTable gameData={game(achievement(1, { Points: 5, NumAwarded: 900 }), achievement(2, { Points: 25, NumAwarded: 30 }))} />)
  const table = within(screen.getByRole('table'))
  expect(table.getByRole('columnheader', { name: en.gameInfoTable.headerHC })).toBeInTheDocument()
  fireEvent.click(table.getByRole('button', { name: en.gameInfoTable.headerPoints }))
  expect(names()).toEqual(['Ach 2', 'Ach 1'])
  fireEvent.click(table.getByRole('button', { name: en.gameInfoTable.headerPlayers }))
  expect(names()).toEqual(['Ach 1', 'Ach 2'])
})

test('the order menu offers points first, as RA reads them', () => {
  render(<GameInfoTable gameData={game(achievement(1))} />)
  fireEvent.click(screen.getByRole('combobox', { name: en.gameInfoTable.sortLabel }))
  expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
    en.gameInfoTable.sortGameOrder, en.gameInfoTable.headerPoints, en.gameInfoTable.headerRarity, en.gameInfoTable.headerPlayers, en.gameInfoTable.headerEarned,
  ])
})
