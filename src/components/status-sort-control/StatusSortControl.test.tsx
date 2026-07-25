import { fireEvent, render, screen } from '@testing-library/react'
import StatusSortControl, { StatusSortState } from './StatusSortControl'

function setup(cat: string, sortState: StatusSortState) {
  const onChange = jest.fn()
  render(<StatusSortControl cat={cat} sortState={sortState} onChange={onChange} />)
  return { onChange }
}

test('renders the current sort criterion and direction', () => {
  setup('playing', { key: 'lastPlayed', dir: 'desc' })
  expect(screen.getByRole('button', { name: /Sort/i })).toHaveTextContent('Last played ↓')
})

test('menu is hidden until the trigger is clicked', () => {
  setup('playing', { key: 'lastPlayed', dir: 'desc' })
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  expect(screen.getByRole('menu')).toBeInTheDocument()
})

test('only shows sort options valid for the category', () => {
  setup('wantToPlay', { key: 'name', dir: 'asc' })
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  expect(screen.getByRole('menuitem', { name: /A-Z/i })).toBeInTheDocument()
  expect(screen.getByRole('menuitem', { name: /Points/i })).toBeInTheDocument()
  expect(screen.queryByRole('menuitem', { name: /Last played/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('menuitem', { name: /% completed/i })).not.toBeInTheDocument()
})

test('clicking a new criterion applies its default direction', () => {
  const { onChange } = setup('playing', { key: 'lastPlayed', dir: 'desc' })
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  fireEvent.click(screen.getByRole('menuitem', { name: /^A-Z/ }))
  expect(onChange).toHaveBeenCalledWith({ key: 'name', dir: 'asc' })
})

test('clicking the already-active criterion flips the direction', () => {
  const { onChange } = setup('playing', { key: 'lastPlayed', dir: 'desc' })
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  fireEvent.click(screen.getByRole('menuitem', { name: /Last played/i }))
  expect(onChange).toHaveBeenCalledWith({ key: 'lastPlayed', dir: 'asc' })
})

test('closes the menu on outside click', () => {
  setup('playing', { key: 'lastPlayed', dir: 'desc' })
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  expect(screen.getByRole('menu')).toBeInTheDocument()
  fireEvent.mouseDown(document.body)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

test('closes the menu on Escape', () => {
  setup('playing', { key: 'lastPlayed', dir: 'desc' })
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})
