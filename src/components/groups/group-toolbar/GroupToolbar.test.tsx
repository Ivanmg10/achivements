import { fireEvent, render, screen } from '@testing-library/react'
import GroupToolbar from './GroupToolbar'
import type { GameGroupItem } from '@/types/types'
import type { GroupFilters } from '@/utils/groupItems'

const item = (over: Partial<GameGroupItem>) => ({ id: 1, console_name: 'SNES', release_year: null, ...over }) as GameGroupItem
const filters = (over: Partial<GroupFilters> = {}): GroupFilters => ({ consoles: new Set(), pct: 'all', decade: 'all', ...over })

function setup(items: GameGroupItem[], f = filters()) {
  const handlers = { onView: jest.fn(), onPct: jest.fn(), onDecade: jest.fn(), onToggleConsole: jest.fn(), onClearConsoles: jest.fn() }
  render(<GroupToolbar items={items} filters={f} view="covers" {...handlers} />)
  return handlers
}

test('progress states, the current one pressed', () => {
  const h = setup([item({})])
  expect(screen.getByRole('button', { name: 'All 1' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Completed' }))
  expect(h.onPct).toHaveBeenCalledWith('100')
})

test('consoles only when there is more than one, each a checkbox', () => {
  const h = setup([item({ id: 1, console_name: 'SNES' }), item({ id: 2, console_name: 'Mega Drive' })], filters({ consoles: new Set(['SNES']) }))
  expect(screen.getByText('Console', { selector: 'summary span' })).toBeInTheDocument()
  expect(screen.getByText('SNES', { selector: 'summary span' })).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: 'SNES' })).toBeChecked()
  fireEvent.click(screen.getByRole('checkbox', { name: 'Mega Drive' }))
  expect(h.onToggleConsole).toHaveBeenCalledWith('Mega Drive')
  fireEvent.click(screen.getByRole('button', { name: 'All consoles' }))
  expect(h.onClearConsoles).toHaveBeenCalled()
})

test('no console or decade menus with one console and no years', () => {
  setup([item({})])
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Decade')).not.toBeInTheDocument()
})

test('decade once a release year is known', () => {
  const h = setup([item({ release_year: 1994 })])
  fireEvent.click(screen.getByRole('combobox', { name: 'Decade' }))
  fireEvent.click(screen.getByRole('option', { name: "90's" }))
  expect(h.onDecade).toHaveBeenCalledWith('90s')
})

test('switches between covers and the list', () => {
  const h = setup([item({})])
  expect(screen.getByRole('button', { name: 'Covers' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'List' }))
  expect(h.onView).toHaveBeenCalledWith('list')
})
