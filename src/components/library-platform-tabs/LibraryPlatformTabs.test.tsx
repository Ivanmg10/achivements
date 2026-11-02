import { fireEvent, render, screen } from '@testing-library/react'
import LibraryPlatformTabs from './LibraryPlatformTabs'

const counts = { ra: 12, steam: 30, psn: 0, xbox: 0 }

test('all, and each platform that has games, with how many', () => {
  render(<LibraryPlatformTabs value="all" counts={counts} onChange={jest.fn()} />)
  expect(screen.getByRole('tablist', { name: 'Platform' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'All 42' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'RetroAchievements 12' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Steam 30' })).toBeInTheDocument()
  // No games, no tab.
  expect(screen.queryByRole('tab', { name: /PlayStation/ })).not.toBeInTheDocument()
})

test('marks the one chosen and reports a change', () => {
  const onChange = jest.fn()
  render(<LibraryPlatformTabs value="steam" counts={counts} onChange={onChange} />)
  expect(screen.getByRole('tab', { name: 'Steam 30' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'All 42' })).toHaveAttribute('aria-selected', 'false')
  fireEvent.click(screen.getByRole('tab', { name: 'RetroAchievements 12' }))
  expect(onChange).toHaveBeenCalledWith('ra')
})

test('nothing to choose with a single platform', () => {
  const { container } = render(<LibraryPlatformTabs value="all" counts={{ ra: 0, steam: 5, psn: 0, xbox: 0 }} onChange={jest.fn()} />)
  expect(container).toBeEmptyDOMElement()
})
