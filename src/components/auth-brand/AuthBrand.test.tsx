import { render, screen } from '@testing-library/react'
import AuthBrand from './AuthBrand'

test('names the app with its logo and says what it is for', () => {
  const { container } = render(<AuthBrand />)
  expect(screen.getByText('CheevoVault')).toHaveClass('italic')
  expect(container.querySelector('svg.text-accent')).not.toBeNull()
  expect(screen.getByText('Every achievement you have earned, in one place')).toBeInTheDocument()
})

test('lists the platforms it reads on one line, joined by the mark', () => {
  render(<AuthBrand />)
  const line = screen.getByText('RetroAchievements').parentElement!
  expect(line.textContent).toBe('RetroAchievements, Steam, PlayStation')
  expect(line.querySelectorAll('[aria-hidden="true"].font-bold')).toHaveLength(2)
})
