import { render, screen } from '@testing-library/react'
import LibraryToolbar, { LIBRARY_COLUMNS } from './LibraryToolbar'

test('the search first, then the filters, and the views at the far end', () => {
  render(<LibraryToolbar search={<input aria-label="Search" />} filters={<button>Almost done</button>} end={<button>Cards</button>} />)
  const [search, filter, view] = [screen.getByLabelText('Search'), screen.getByText('Almost done'), screen.getByText('Cards')]
  expect(search.compareDocumentPosition(filter) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(filter.compareDocumentPosition(view) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

test('what does not apply is simply left out', () => {
  const { container } = render(<LibraryToolbar search={<input aria-label="Search" />} />)
  expect(container.querySelectorAll('button')).toHaveLength(0)
})

test('the search sits in the list\'s own column, so it is as wide as the list under it', () => {
  const { container } = render(<LibraryToolbar search={<input aria-label="Search" />} end={<button>Cards</button>} />)
  expect(container.firstElementChild!.className).toContain(LIBRARY_COLUMNS)
  expect(container.firstElementChild!.firstElementChild).toBe(screen.getByLabelText('Search'))
})
