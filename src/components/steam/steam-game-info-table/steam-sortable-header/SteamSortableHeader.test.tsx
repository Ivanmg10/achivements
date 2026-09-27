import { render, screen, fireEvent } from '@testing-library/react'
import { SteamSortableHeader, STEAM_DEFAULT_DIRS } from './SteamSortableHeader'

function renderHeader(sortState: { key: 'default' | 'rarity' | 'earned'; dir: 'asc' | 'desc' }, onSort = jest.fn()) {
  render(
    <table>
      <thead>
        <tr>
          <SteamSortableHeader sortKey="rarity" sortState={sortState} onSort={onSort} className="w-32">
            Rarity
          </SteamSortableHeader>
        </tr>
      </thead>
    </table>,
  )
  return onSort
}

test('is a real button inside the column header', () => {
  const onSort = renderHeader({ key: 'default', dir: 'asc' })
  fireEvent.click(screen.getByRole('button', { name: 'Rarity' }))
  expect(onSort).toHaveBeenCalledWith('rarity')
})

test('an inactive column reports no order and shows no arrow', () => {
  renderHeader({ key: 'default', dir: 'asc' })
  expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe('none')
  expect(screen.getByRole('button').textContent).toBe('Rarity')
})

test('the active column reports its direction, with a decorative arrow', () => {
  renderHeader({ key: 'rarity', dir: 'desc' })
  const th = screen.getByRole('columnheader')
  expect(th.getAttribute('aria-sort')).toBe('descending')
  expect(th.className).toContain('w-32')
  expect(screen.getByText('↓', { exact: false }).getAttribute('aria-hidden')).toBe('true')
})

test('ascending shows the up arrow', () => {
  renderHeader({ key: 'rarity', dir: 'asc' })
  expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe('ascending')
  expect(screen.getByText('↑', { exact: false })).toBeInTheDocument()
})

test('first-click directions: rarest first, newest unlock first', () => {
  expect(STEAM_DEFAULT_DIRS).toEqual({ default: 'asc', rarity: 'asc', earned: 'desc' })
})
