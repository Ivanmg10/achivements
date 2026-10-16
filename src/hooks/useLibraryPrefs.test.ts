import { act, renderHook } from '@testing-library/react'
import { useLibraryPrefs } from './useLibraryPrefs'

beforeEach(() => localStorage.clear())

test('starts from the category\'s default order, two columns, platforms apart', () => {
  const { result } = renderHook(() => useLibraryPrefs('playing'))
  expect(result.current.sortState).toEqual({ key: 'lastPlayed', dir: 'desc' })
  expect(result.current.gridCols).toBe(2)
  expect(result.current.view).toBe('platform')
})

test('wantToPlay starts by name', () => {
  const { result } = renderHook(() => useLibraryPrefs('wantToPlay'))
  expect(result.current.sortState).toEqual({ key: 'name', dir: 'asc' })
})

test('remembers each choice, and the order per category', () => {
  const { result } = renderHook(() => useLibraryPrefs('playing'))
  act(() => {
    result.current.setSortState({ key: 'percent', dir: 'asc' })
    result.current.setAllSortState({ key: 'name', dir: 'desc' })
    result.current.setGridCols(3)
    result.current.setView('all')
    result.current.setLayout('list')
  })
  expect(result.current.sortState).toEqual({ key: 'percent', dir: 'asc' })
  expect(result.current.allSortState).toEqual({ key: 'name', dir: 'desc' })
  expect(result.current.gridCols).toBe(3)
  expect(result.current.view).toBe('all')
  expect(result.current.layout).toBe('list')
  // Another category keeps its own order; the layout choices are shared.
  const other = renderHook(() => useLibraryPrefs('completed')).result
  expect(other.current.sortState).toEqual({ key: 'lastPlayed', dir: 'desc' })
  expect(other.current.gridCols).toBe(3)
  expect(other.current.layout).toBe('list')
})

test('ignores a stored value that is not an option', () => {
  localStorage.setItem('library-cols', '9')
  localStorage.setItem('library-layout', 'carousel')
  localStorage.setItem('library-sort:playing', 'bogus')
  const { result } = renderHook(() => useLibraryPrefs('playing'))
  expect(result.current.gridCols).toBe(2)
  expect(result.current.layout).toBe('shelves')
  expect(result.current.sortState).toEqual({ key: 'lastPlayed', dir: 'desc' })
})
