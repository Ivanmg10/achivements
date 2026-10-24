global.fetch = jest.fn()

import { fireEvent, render, screen } from '@testing-library/react'
import GameInfoTable from './GameInfoTable'
import { useSession } from 'next-auth/react'

beforeEach(() => {
  ;(useSession as jest.Mock).mockReturnValue({ data: null })
  ;(fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
})

const mockAchievement = {
  ID: 1,
  Title: 'First Blood',
  Description: 'Kill an enemy',
  BadgeName: 'badge123',
  Points: 10,
  TrueRatio: 15,
  NumAwarded: 500,
  NumAwardedHardcore: 100,
  DateEarned: null,
  DateEarnedHardcore: null,
  Author: 'Author1',
  AuthorULID: 'ulid',
  DateModified: '2023-01-01',
  DateCreated: '2022-01-01',
  DisplayOrder: 1,
  MemAddr: '0x0000',
}

const mockGameData = { Achievements: { '1': mockAchievement } } as never

test('renders table with achievements', () => {
  render(<GameInfoTable gameData={mockGameData} />)
  expect(screen.getByText('Icon')).toHaveClass('sr-only')
  expect(screen.getAllByText('First Blood')).toHaveLength(2)
})

test('renders empty when no gameData', () => {
  const { container } = render(<GameInfoTable />)
  expect(container.querySelector('table')).toBeNull()
})

test('filters out undefined achievements', () => {
  const gameData = { Achievements: { '1': mockAchievement, '2': undefined } } as never
  render(<GameInfoTable gameData={gameData} />)
  expect(screen.getAllByText('First Blood')).toHaveLength(2)
})

const many = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [String(i + 1), { ...mockAchievement, ID: i + 1, Title: `Ach ${i + 1}`, DisplayOrder: i + 1 }]),
)

test('the first rows only, then a button for the rest; hidden ones are not rendered', () => {
  render(<GameInfoTable gameData={{ Achievements: many } as never} />)
  expect(screen.queryAllByRole('button', { name: 'Ach 10' })).toHaveLength(0)
  expect(screen.getAllByRole('button', { name: 'Ach 8' }).length).toBeGreaterThan(0)
  fireEvent.click(screen.getByRole('button', { name: /Show the other 2/ }))
  expect(screen.getAllByRole('button', { name: 'Ach 10' }).length).toBeGreaterThan(0)
})

test('a search shows every match, and says when there is none', () => {
  render(<GameInfoTable gameData={{ Achievements: many } as never} />)
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search an achievement' }), { target: { value: 'ach 10' } })
  expect(screen.getAllByRole('button', { name: 'Ach 10' }).length).toBeGreaterThan(0)
  expect(screen.queryAllByRole('button', { name: 'Ach 1' })).toHaveLength(0)
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search an achievement' }), { target: { value: 'zzz' } })
  expect(screen.getByText('No achievement matches')).toBeInTheDocument()
})

test('missables: one line, and a button that keeps only them', () => {
  const ach = { ...many, '11': { ...mockAchievement, ID: 11, Title: 'Lose me', Type: 'missable', DisplayOrder: 11 } }
  render(<GameInfoTable gameData={{ Achievements: ach } as never} />)
  expect(screen.getByRole('status')).toHaveTextContent('1 achievement can be missed')
  fireEvent.click(screen.getByRole('button', { name: 'Show only those' }))
  expect(screen.getAllByRole('button', { name: 'Lose me' }).length).toBeGreaterThan(0)
  expect(screen.queryAllByRole('button', { name: 'Ach 1' })).toHaveLength(0)
})

test('columns sort through real buttons and report their order', () => {
  render(<GameInfoTable gameData={{ Achievements: many } as never} />)
  const header = screen.getAllByRole('columnheader').find((h) => h.getAttribute('aria-sort') === 'ascending')!
  expect(header).toBeDefined()
  expect(header.querySelector('button')).not.toBeNull()
})

test('the filters say which one is on', () => {
  render(<GameInfoTable gameData={{ Achievements: many } as never} />)
  expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
})
