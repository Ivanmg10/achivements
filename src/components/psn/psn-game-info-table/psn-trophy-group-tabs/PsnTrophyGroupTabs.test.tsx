import { render, screen, fireEvent } from '@testing-library/react'
import PsnTrophyGroupTabs from './PsnTrophyGroupTabs'
import { en } from '@/translations/en'
import type { PsnTrophyGroup } from '@/types/psn'

const counts = (bronze: number, platinum = 0) => ({ bronze, silver: 0, gold: 0, platinum })
const GROUPS: PsnTrophyGroup[] = [
  { id: 'default', name: 'Astro Bot', iconUrl: null, defined: counts(9, 1), earned: counts(9, 1), progress: 100 },
  { id: '001', name: 'Winter Wonder', iconUrl: null, defined: counts(4), earned: counts(1), progress: 25 },
]

function setup(selected = 'all') {
  const onSelect = jest.fn()
  render(<PsnTrophyGroupTabs groups={GROUPS} selected={selected} onSelect={onSelect} panelId="panel" />)
  return onSelect
}

test('everything, the base game, then each DLC by name, with its progress', () => {
  setup()
  const tabs = screen.getAllByRole('tab')
  expect(tabs.map((t) => t.textContent)).toEqual([en.psn.allGroups, `${en.psn.baseGame}10/10`, 'Winter Wonder1/4'])
  expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  expect(tabs[0]).toHaveAttribute('aria-controls', 'panel')
})

test('only the selected tab is in the tab order; clicking selects', () => {
  const onSelect = setup('001')
  const tabs = screen.getAllByRole('tab')
  expect(tabs.map((t) => t.tabIndex)).toEqual([-1, -1, 0])
  fireEvent.click(tabs[1])
  expect(onSelect).toHaveBeenCalledWith('default')
})

test('arrow keys, Home and End move between tabs, wrapping around', () => {
  const onSelect = setup()
  const [first, , last] = screen.getAllByRole('tab')
  fireEvent.keyDown(first, { key: 'ArrowLeft' })
  expect(onSelect).toHaveBeenLastCalledWith('001')
  expect(last).toHaveFocus()
  fireEvent.keyDown(last, { key: 'ArrowRight' })
  expect(onSelect).toHaveBeenLastCalledWith('all')
  fireEvent.keyDown(first, { key: 'End' })
  expect(onSelect).toHaveBeenLastCalledWith('001')
  fireEvent.keyDown(last, { key: 'Home' })
  expect(onSelect).toHaveBeenLastCalledWith('all')
})
