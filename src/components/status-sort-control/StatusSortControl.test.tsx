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

test('the options are hidden until the trigger is clicked', () => {
  setup('playing', { key: 'lastPlayed', dir: 'desc' })
  const trigger = screen.getByRole('button', { name: /Sort/i })
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('button', { name: /^A-Z/ })).not.toBeInTheDocument()
  fireEvent.click(trigger)
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('button', { name: /^A-Z/ })).toBeInTheDocument()
})

test('the current criterion is marked as pressed, not by colour alone', () => {
  setup('playing', { key: 'lastPlayed', dir: 'desc' })
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  expect(screen.getByRole('button', { name: /^Last played/ })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: /^A-Z/ })).toHaveAttribute('aria-pressed', 'false')
})

test('only shows sort options valid for the category', () => {
  setup('wantToPlay', { key: 'name', dir: 'asc' })
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  expect(screen.getByRole('button', { name: /A-Z/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Points/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Last played/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /% completed/i })).not.toBeInTheDocument()
})

test('clicking a new criterion applies its default direction', () => {
  const { onChange } = setup('playing', { key: 'lastPlayed', dir: 'desc' })
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  fireEvent.click(screen.getByRole('button', { name: /^A-Z/ }))
  expect(onChange).toHaveBeenCalledWith({ key: 'name', dir: 'asc' })
})

test('clicking the already-active criterion flips the direction', () => {
  const { onChange } = setup('playing', { key: 'lastPlayed', dir: 'desc' })
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  fireEvent.click(screen.getByRole('button', { name: /Last played/i }))
  expect(onChange).toHaveBeenCalledWith({ key: 'lastPlayed', dir: 'asc' })
})

test('closes the list on outside click', () => {
  setup('playing', { key: 'lastPlayed', dir: 'desc' })
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  expect(screen.getByRole('button', { name: /^A-Z/ })).toBeInTheDocument()
  fireEvent.mouseDown(document.body)
  expect(screen.queryByRole('button', { name: /^A-Z/ })).not.toBeInTheDocument()
})

test('closes the list on Escape', () => {
  setup('playing', { key: 'lastPlayed', dir: 'desc' })
  fireEvent.click(screen.getByRole('button', { name: /Sort/i }))
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(screen.queryByRole('button', { name: /^A-Z/ })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Sort/i })).toHaveFocus()
})
