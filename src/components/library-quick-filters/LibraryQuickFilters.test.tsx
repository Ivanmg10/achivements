import { fireEvent, render, screen } from '@testing-library/react'
import LibraryQuickFilters from './LibraryQuickFilters'

const counts = { all: 10, almost: 3, stalled: 0 }

test('a labelled group with each filter and how many it holds', () => {
  render(<LibraryQuickFilters value="all" counts={counts} onChange={jest.fn()} />)
  expect(screen.getByRole('group', { name: 'Quick filters' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^All 10$/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: /Almost done 3/ })).toHaveAttribute('aria-pressed', 'false')
})

test('reports the chosen filter', () => {
  const onChange = jest.fn()
  render(<LibraryQuickFilters value="all" counts={counts} onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: /Almost done/ }))
  expect(onChange).toHaveBeenCalledWith('almost')
})

test('an empty filter is disabled', () => {
  const onChange = jest.fn()
  render(<LibraryQuickFilters value="all" counts={counts} onChange={onChange} />)
  const stalled = screen.getByRole('button', { name: /Stalled 0/ })
  expect(stalled).toBeDisabled()
  fireEvent.click(stalled)
  expect(onChange).not.toHaveBeenCalled()
})

test('on all games the filters are the statuses, each with its count', () => {
  const onChange = jest.fn()
  render(<LibraryQuickFilters value="all" counts={{ all: 9, playing: 4, completed: 3, wantToPlay: 2 }} filters={['all', 'playing', 'completed', 'wantToPlay']} onChange={onChange} />)
  expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['All9', 'In progress4', 'Completed3', 'Not started2'])
  fireEvent.click(screen.getByRole('button', { name: /Completed/ }))
  expect(onChange).toHaveBeenCalledWith('completed')
})

test('the filter in use can always be left, even when it empties', () => {
  render(<LibraryQuickFilters value="stalled" counts={counts} onChange={jest.fn()} />)
  const stalled = screen.getByRole('button', { name: /Stalled 0/ })
  expect(stalled).toBeEnabled()
  expect(stalled).toHaveAttribute('aria-pressed', 'true')
})
