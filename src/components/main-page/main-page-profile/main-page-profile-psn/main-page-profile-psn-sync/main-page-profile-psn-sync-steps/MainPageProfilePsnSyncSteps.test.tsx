import { render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import MainPageProfilePsnSyncSteps from './MainPageProfilePsnSyncSteps'

test('the four steps in order, each with its state in words for screen readers', () => {
  render(<MainPageProfilePsnSyncSteps steps={{ trophies: 'done', library: 'done', playtime: 'active', history: 'waiting' }} />)
  const items = screen.getAllByRole('listitem').map((li) => li.textContent)
  const { steps, stepState } = en.psn.sync
  expect(items).toEqual([
    `${steps.trophies}: ${stepState.done}`,
    `${steps.library}: ${stepState.done}`,
    `${steps.playtime}: ${stepState.active}`,
    `${steps.history}: ${stepState.waiting}`,
  ])
})

test('a waiting step is dimmed and its icon has its own shape, never the colour alone', () => {
  const { container } = render(<MainPageProfilePsnSyncSteps steps={{ trophies: 'done', library: 'active', playtime: 'waiting', history: 'waiting' }} />)
  const items = screen.getAllByRole('listitem')
  expect(items[2].className).toContain('text-text-secondary')
  const icons = [...container.querySelectorAll('svg')].map((svg) => svg.getAttribute('data-testid'))
  expect(new Set(icons.slice(0, 3)).size).toBe(3)
  container.querySelectorAll('svg').forEach((svg) => expect(svg).toHaveAttribute('aria-hidden', 'true'))
})
