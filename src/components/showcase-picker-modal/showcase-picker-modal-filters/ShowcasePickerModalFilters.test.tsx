import { render, screen, fireEvent } from '@testing-library/react'
import ShowcasePickerModalFilters from './ShowcasePickerModalFilters'
import { en } from '@/translations/en'

beforeAll(() => {
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver
})

const base = { isLoading: false, query: '', onQuery: jest.fn(), platform: 'all' as const, onPlatform: jest.fn() }

test('searches, and filters by platform in one row that scrolls instead of wrapping', () => {
  const onPlatform = jest.fn()
  render(<ShowcasePickerModalFilters {...base} onPlatform={onPlatform} counts={[['ra', 3], ['steam', 2]]} />)
  fireEvent.click(screen.getByRole('button', { name: /Steam/ }))
  expect(onPlatform).toHaveBeenCalledWith('steam')
  const row = screen.getByRole('group', { name: en.showcase.platformFilter })
  expect(row.className).toContain('overflow-x-auto')
  expect(row.className).not.toContain('flex-wrap')
  expect(screen.getByRole('searchbox', { name: en.showcase.pickerSearch })).toBeInTheDocument()
})

test('no platform chips with only one platform, and a skeleton in place of the search while loading', () => {
  const { rerender } = render(<ShowcasePickerModalFilters {...base} counts={[['ra', 3]]} />)
  expect(screen.queryByRole('group')).not.toBeInTheDocument()
  rerender(<ShowcasePickerModalFilters {...base} isLoading counts={[]} />)
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
})
