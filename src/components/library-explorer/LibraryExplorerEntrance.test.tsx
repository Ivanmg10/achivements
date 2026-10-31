jest.mock('@/components/library-shelves/LibraryShelves', () => ({ __esModule: true, default: () => <div data-testid="shelves" /> }))
jest.mock('@/components/library-list/LibraryList', () => ({ __esModule: true, default: () => <div data-testid="list" /> }))
jest.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: jest.fn(() => true) }))

import { render, screen } from '@testing-library/react'
import { AnimatePresence } from 'framer-motion'
import LibraryExplorer from './LibraryExplorer'
import { libraryEntry } from '@/test-utils/libraryFixtures'

const props = {
  category: 'playing', entries: [libraryEntry('steam', 1, 'Hades')], platform: 'all' as const, layout: 'shelves' as const, onLayout: jest.fn(),
  query: '', onQuery: jest.fn(), quick: 'all' as const, onQuick: jest.fn(), sort: { key: 'name' as const, dir: 'asc' as const },
  onSort: jest.fn(), selectedKey: null, onSelectKey: jest.fn(),
}

// The mock of AnimatePresence keeps the props it was given.
const presence = AnimatePresence as unknown as { lastProps: { initial?: boolean; mode?: string } }

test('the swap between views plays only on a swap: the first load is the rows and cards, in CSS', () => {
  render(<LibraryExplorer {...props} />)
  expect(screen.getByTestId('shelves')).toBeInTheDocument()
  expect(presence.lastProps.initial).toBe(false)
  expect(presence.lastProps.mode).toBe('wait')
})
