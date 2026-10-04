import { fireEvent, render, screen } from '@testing-library/react'
import MainPageStatsRail from './MainPageStatsRail'

const SECTIONS = [
  { id: 'a', label: 'Overview', icon: <span /> },
  { id: 'b', label: 'Games', icon: <span /> },
  { id: 'c', label: 'Collection', icon: <span /> },
]

function renderRail(active = 'a', onChange = jest.fn()) {
  render(<MainPageStatsRail sections={SECTIONS} active={active} onChange={onChange} label="Sections" idPrefix="s" />)
  return onChange
}

test('is a named tablist with one tab per section', () => {
  renderRail()
  expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument()
  expect(screen.getAllByRole('tab')).toHaveLength(3)
})

test('marks the selected tab and keeps only it in the tab order', () => {
  renderRail('b')
  const games = screen.getByRole('tab', { name: 'Games' })
  expect(games).toHaveAttribute('aria-selected', 'true')
  expect(games).toHaveAttribute('tabindex', '0')
  expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('tabindex', '-1')
  expect(games).toHaveAttribute('aria-controls', 's-panel-b')
})

test('clicking a tab selects its section', () => {
  const onChange = renderRail()
  fireEvent.click(screen.getByRole('tab', { name: 'Collection' }))
  expect(onChange).toHaveBeenCalledWith('c')
})

test('arrow keys move to the next and previous section, wrapping around', () => {
  const onChange = renderRail('a')
  const first = screen.getByRole('tab', { name: 'Overview' })
  fireEvent.keyDown(first, { key: 'ArrowDown' })
  expect(onChange).toHaveBeenLastCalledWith('b')
  fireEvent.keyDown(first, { key: 'ArrowLeft' })
  expect(onChange).toHaveBeenLastCalledWith('c')
})

test('Home and End jump to the first and last section', () => {
  const onChange = renderRail('b')
  const games = screen.getByRole('tab', { name: 'Games' })
  fireEvent.keyDown(games, { key: 'End' })
  expect(onChange).toHaveBeenLastCalledWith('c')
  fireEvent.keyDown(games, { key: 'Home' })
  expect(onChange).toHaveBeenLastCalledWith('a')
})

test('other keys are left alone', () => {
  const onChange = renderRail()
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Overview' }), { key: 'x' })
  expect(onChange).not.toHaveBeenCalled()
})
