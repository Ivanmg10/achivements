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
  lastPlayed: '2026-10-25T14:18:57Z',
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
  expect(screen.getByText(new RegExp(en.statusGameItem.lastPlayed))).toHaveTextContent('2026')
  unmount()
  row({ ...ENTRY, completedAt: null }, 'completed')
  expect(screen.getByText(new RegExp(en.statusGameItem.lastPlayed))).toBeInTheDocument()
})
