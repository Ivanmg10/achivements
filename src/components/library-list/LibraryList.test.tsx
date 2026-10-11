jest.mock('@/components/library-entry-cover/LibraryEntryCover', () => ({
  __esModule: true,
  default: ({ entry, shared }: { entry: { key: string }; shared?: boolean }) => <span data-testid="cover" data-shared={String(!!shared)}>{entry.key}</span>,
  entryBackdrop: () => null,
}))
jest.mock('@/components/library-entry-detail/LibraryEntryDetail', () => ({
  __esModule: true,
  default: ({ entry }: { entry: { key: string } }) => <div data-testid="detail">{entry.key}</div>,
}))

import { fireEvent, render, screen } from '@testing-library/react'
import LibraryList from './LibraryList'
import { libraryEntry } from '@/test-utils/libraryFixtures'
import { en } from '@/translations/en'

const entries = [libraryEntry('steam', 1, 'Hades'), libraryEntry('ra', 2, 'Sonic'), libraryEntry('psn', 3, 'Astro')]
const base = { entries, category: 'playing', onSelect: jest.fn() }

beforeAll(() => { Element.prototype.scrollIntoView = jest.fn() })
beforeEach(() => jest.clearAllMocks())

describe('wide: the detail beside the list', () => {
  test('every game is a row, the selected one marked, its detail beside', () => {
    render(<LibraryList {...base} selected={entries[1]} wide />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
    expect(screen.getByRole('button', { name: /Sonic/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: /Hades/ })).not.toHaveAttribute('aria-current')
    expect(screen.getAllByTestId('detail')).toHaveLength(1)
    expect(screen.getByTestId('detail')).toHaveTextContent('ra:2')
  })

  test('picking a row selects it, also the current one', () => {
    render(<LibraryList {...base} selected={entries[1]} wide />)
    fireEvent.click(screen.getByRole('button', { name: /Astro/ }))
    expect(base.onSelect).toHaveBeenLastCalledWith(entries[2])
    fireEvent.click(screen.getByRole('button', { name: /Sonic/ }))
    expect(base.onSelect).toHaveBeenLastCalledWith(entries[1])
  })
})

describe('narrow: the detail under its row', () => {
  test('only the selected row opens its detail, in its place', () => {
    render(<LibraryList {...base} selected={entries[0]} wide={false} />)
    const detail = screen.getByTestId('detail')
    expect(detail).toHaveTextContent('steam:1')
    expect(detail.closest('li')).toContainElement(screen.getByRole('button', { name: /Hades/ }))
  })

  test('the open row closes it again', () => {
    render(<LibraryList {...base} selected={entries[0]} wide={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Hades/ }))
    expect(base.onSelect).toHaveBeenCalledWith(null)
  })

  test('nothing open shows no detail', () => {
    render(<LibraryList {...base} wide={false} />)
    expect(screen.queryByTestId('detail')).not.toBeInTheDocument()
  })
})

test('says so when nothing matches', () => {
  render(<LibraryList {...base} entries={[]} wide />)
  expect(screen.getByText(en.libraryFilters.noMatches)).toBeInTheDocument()
})
