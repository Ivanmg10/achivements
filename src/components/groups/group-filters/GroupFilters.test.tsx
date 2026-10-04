import { fireEvent, render, screen, within } from '@testing-library/react'
import { en } from '@/translations/en'
import GroupFilters from './GroupFilters'
import type { GameGroupItem } from '@/types/types'

jest.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ T: jest.requireActual('@/translations/en').en, lang: 'en' }) }))
jest.mock('next/image', () => () => null)

const item = (id: number, console_name: string, release_year: number | null) => ({ id, console_name, release_year }) as GameGroupItem
const filters = { consoles: new Set<string>(), pct: 'all' as const, decade: 'all' as const }

function setup(items: GameGroupItem[]) {
  const props = { onPct: jest.fn(), onDecade: jest.fn(), onToggleConsole: jest.fn(), onClearConsoles: jest.fn() }
  render(<GroupFilters items={items} filters={filters} {...props} />)
  return props
}

test('progress and decade are labelled groups, so their two "All" are told apart', () => {
  setup([item(1, 'SNES', 1994), item(2, 'PS2', 2004)])
  const progress = screen.getByRole('group', { name: en.groups.filterProgressLabel })
  const decade = screen.getByRole('group', { name: en.groups.filterDecadeLabel })
  expect(within(progress).getByRole('button', { name: en.groups.filterAll })).toHaveAttribute('aria-pressed', 'true')
  expect(within(decade).getByRole('button', { name: en.groups.filterAll })).toHaveAttribute('aria-pressed', 'true')
})

test('picking a console reports it by name', () => {
  const props = setup([item(1, 'SNES', null), item(2, 'PS2', null)])
  fireEvent.click(screen.getByRole('button', { name: 'SNES' }))
  expect(props.onToggleConsole).toHaveBeenCalledWith('SNES')
})

test('no decade row until a year is known, no console row for a single console', () => {
  setup([item(1, 'SNES', null), item(2, 'SNES', 0)])
  expect(screen.queryByRole('group', { name: en.groups.filterDecadeLabel })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'SNES' })).not.toBeInTheDocument()
})
