import { fireEvent, render, screen } from '@testing-library/react'
import LibraryPlatformTabs from './LibraryPlatformTabs'

const counts = { ra: 12, steam: 30, psn: 0 }

test('all, and each platform that has games, with how many', () => {
  render(<LibraryPlatformTabs value="all" counts={counts} onChange={jest.fn()} />)
  expect(screen.getByRole('group', { name: 'Platform' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'All 42' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'RetroAchievements 12' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Steam 30' })).toBeInTheDocument()
  // No games, no tab.
  expect(screen.queryByRole('button', { name: /PlayStation/ })).not.toBeInTheDocument()
})

test('marks the one chosen and reports a change', () => {
  const onChange = jest.fn()
  render(<LibraryPlatformTabs value="steam" counts={counts} onChange={onChange} />)
  expect(screen.getByRole('button', { name: 'Steam 30' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'All 42' })).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(screen.getByRole('button', { name: 'RetroAchievements 12' }))
  expect(onChange).toHaveBeenCalledWith('ra')
})

test('nothing to choose with a single platform', () => {
  const { container } = render(<LibraryPlatformTabs value="all" counts={{ ra: 0, steam: 5, psn: 0 }} onChange={jest.fn()} />)
  expect(container).toBeEmptyDOMElement()
})
