import { render, screen, fireEvent } from '@testing-library/react'
import DesignCatalog from './DesignCatalog'
import { STREAK_TIERS } from '@/utils/streakTier'

test('names every part and draws the pieces of each', () => {
  render(<DesignCatalog />)
  expect(screen.getByRole('heading', { level: 1, name: 'Design system' })).toBeInTheDocument()
  for (const title of ['Tokens', 'Buttons', 'Fields', 'Choosers', 'Figures', 'Progress', 'Tiers', 'Surfaces', 'Feedback and overlays']) {
    expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
  }
  // Every streak tier, and every button variant, is shown.
  expect(document.querySelectorAll('[data-tier]')).toHaveLength(STREAK_TIERS.length)
  expect(screen.getAllByRole('button', { name: /^primary · / })).toHaveLength(3)
})

test('the live pieces answer: a switch flips, a modal opens', () => {
  render(<DesignCatalog />)
  const toggle = screen.getByRole('switch', { name: 'Public profile' })
  expect(toggle).toHaveAttribute('aria-checked', 'true')
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-checked', 'false')
  fireEvent.click(screen.getByRole('button', { name: 'Open a modal' }))
  expect(screen.getByRole('dialog', { name: 'A modal' })).toBeInTheDocument()
})
