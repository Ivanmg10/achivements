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

test('the filter in use can always be left, even when it empties', () => {
  render(<LibraryQuickFilters value="stalled" counts={counts} onChange={jest.fn()} />)
  const stalled = screen.getByRole('button', { name: /Stalled 0/ })
  expect(stalled).toBeEnabled()
  expect(stalled).toHaveAttribute('aria-pressed', 'true')
})
