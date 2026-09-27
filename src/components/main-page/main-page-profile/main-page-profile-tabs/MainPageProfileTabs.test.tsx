import { render, screen, fireEvent } from '@testing-library/react'
import MainPageProfileTabs, { profilePanelId, profileTabId } from './MainPageProfileTabs'
import { en } from '@/translations/en'

const TABS = [
  { id: 'ra' as const, label: 'RetroAchievements' },
  { id: 'steam' as const, label: 'Steam' },
]

function renderTabs(selected: 'ra' | 'steam' = 'ra', onSelect = jest.fn()) {
  render(<MainPageProfileTabs tabs={TABS} selected={selected} onSelect={onSelect} idPrefix="p" />)
  return onSelect
}

test('is a labelled tablist marking the selected tab', () => {
  renderTabs('steam')
  expect(screen.getByRole('tablist', { name: en.steam.profileTabsLabel })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Steam' }).getAttribute('aria-selected')).toBe('true')
  expect(screen.getByRole('tab', { name: 'RetroAchievements' }).getAttribute('aria-selected')).toBe('false')
})

test('each tab controls its panel', () => {
  renderTabs()
  const ra = screen.getByRole('tab', { name: 'RetroAchievements' })
  expect(ra.id).toBe(profileTabId('p', 'ra'))
  expect(ra.getAttribute('aria-controls')).toBe(profilePanelId('p', 'ra'))
})

test('only the selected tab is in the tab order', () => {
  renderTabs('ra')
  expect(screen.getByRole('tab', { name: 'RetroAchievements' }).getAttribute('tabindex')).toBe('0')
  expect(screen.getByRole('tab', { name: 'Steam' }).getAttribute('tabindex')).toBe('-1')
})

test('selects on click', () => {
  const onSelect = renderTabs()
  fireEvent.click(screen.getByRole('tab', { name: 'Steam' }))
  expect(onSelect).toHaveBeenCalledWith('steam')
})

describe('keyboard', () => {
  test('arrows move and select, wrapping at the ends, and move focus along', () => {
    const onSelect = renderTabs('ra')
    const ra = screen.getByRole('tab', { name: 'RetroAchievements' })

    fireEvent.keyDown(ra, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith('steam')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Steam' }))

    fireEvent.keyDown(ra, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith('steam')
  })

  test('Home and End jump to the first and last tab', () => {
    const onSelect = renderTabs('steam')
    const steam = screen.getByRole('tab', { name: 'Steam' })

    fireEvent.keyDown(steam, { key: 'Home' })
    expect(onSelect).toHaveBeenLastCalledWith('ra')
    fireEvent.keyDown(steam, { key: 'End' })
    expect(onSelect).toHaveBeenLastCalledWith('steam')
  })

  test('other keys do nothing', () => {
    const onSelect = renderTabs()
    fireEvent.keyDown(screen.getByRole('tab', { name: 'RetroAchievements' }), { key: 'a' })
    expect(onSelect).not.toHaveBeenCalled()
  })
})

test('renders tab icons when given', () => {
  render(
    <MainPageProfileTabs
      tabs={[{ id: 'ra', label: 'RA', icon: <svg data-testid="icon" /> }]}
      selected="ra"
      onSelect={jest.fn()}
      idPrefix="p"
    />,
  )
  expect(screen.getByTestId('icon')).toBeInTheDocument()
})
