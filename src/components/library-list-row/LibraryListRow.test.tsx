jest.mock('@/components/game-card-backdrop/GameCardBackdrop', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/library-entry-cover/LibraryEntryCover', () => ({ __esModule: true, default: () => null, entryIcon: () => null }))
jest.mock('@/components/library-platform-badge/LibraryPlatformBadge', () => ({ __esModule: true, default: () => null }))

import { render, screen } from '@testing-library/react'
import LibraryListRow from './LibraryListRow'
import { en } from '@/translations/en'
import type { LibraryEntry } from '@/utils/libraryInsights'

const ENTRY = {
  kind: 'psn',
  key: 'psn:1',
  title: 'Spider-Man',
  pct: 74,
  lastPlayed: '2025-10-25T14:18:57Z',
  completedAt: '2021-12-23T12:00:00Z',
  game: { id: 1, titleId: 'NPWR09167_00', imageIcon: '', maxPossible: 74, numAwarded: 58 },
} as unknown as LibraryEntry

const row = (entry: LibraryEntry, category?: string) => render(<LibraryListRow entry={entry} current={false} category={category} onSelect={() => {}} />)

test('on Completed it dates the game by its completion, not by a later DLC', () => {
  row(ENTRY, 'completed')
  expect(screen.getByText(new RegExp(en.libraryDetail.finished))).toHaveTextContent('2021')
  expect(screen.queryByText(new RegExp(en.statusGameItem.lastPlayed))).not.toBeInTheDocument()
})

test('elsewhere, or with no completion date, it shows the last session', () => {
  const { unmount } = row(ENTRY, 'playing')
  expect(screen.getByText(new RegExp(en.statusGameItem.lastPlayed))).toHaveTextContent('2025')
  unmount()
  row({ ...ENTRY, completedAt: null }, 'completed')
  expect(screen.getByText(new RegExp(en.statusGameItem.lastPlayed))).toBeInTheDocument()
})

test('a game at 0 % has its bar, as every other; one with nothing to measure keeps the line\'s room', () => {
  const { container, unmount } = row({ ...ENTRY, pct: 0 })
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  expect(screen.getByText('0%')).toBeInTheDocument()
  expect(container.querySelector('[data-no-progress]')).toBeNull()
  unmount()
  const none = row({ ...ENTRY, pct: null })
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  expect(none.container.querySelector('[data-no-progress]')).toHaveAttribute('aria-hidden', 'true')
})

test('the date line joins its facts with the site\'s mark, never a hand-made dot', () => {
  const { container } = row(ENTRY, 'playing')
  const line = screen.getByText(new RegExp(en.statusGameItem.lastPlayed))
  expect(line.textContent).not.toContain('·')
  expect(line.querySelector('[aria-hidden="true"]')).not.toBeNull()
  expect(container.textContent).toContain(', ')
})
