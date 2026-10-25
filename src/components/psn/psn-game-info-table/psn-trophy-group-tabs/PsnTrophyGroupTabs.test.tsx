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
  expect(tabs.map((t) => t.textContent)).toEqual([`${en.psn.allGroups}11/14`, `${en.psn.baseGame}10/10`, 'Winter Wonder1/4'])
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

test("a DLC's name loses the game's title in front, which stays in the tooltip", () => {
  const groups: PsnTrophyGroup[] = [
    GROUPS[0],
    { ...GROUPS[1], name: 'Call of Duty: Black Ops II: Revolution' },
  ]
  render(<PsnTrophyGroupTabs groups={groups} selected="all" onSelect={jest.fn()} panelId="panel" gameTitle="Call of Duty®: Black Ops II" />)
  const dlc = screen.getAllByRole('tab')[2]
  expect(dlc).toHaveTextContent('Revolution1/4')
  expect(dlc).toHaveAttribute('title', 'Call of Duty: Black Ops II: Revolution')
  expect(dlc.querySelector('img')).toBeNull()
})

test('a complete group shows its count in the "done" colour; the selected one is filled', () => {
  setup('001')
  const [, base, dlc] = screen.getAllByRole('tab')
  expect(base.querySelector('.tabular-nums')!.className).toContain('text-success')
  expect(dlc.querySelector('.tabular-nums')!.className).not.toContain('text-success')
  expect(dlc.className).toContain('ring-accent/50')
  expect(base.className).not.toContain('ring-accent/50')
})
