import { render, screen } from '@testing-library/react'
import PlatformLogo from './PlatformLogo'

test('decorative by default, named when given a label, for every platform', () => {
  const { container, rerender } = render(<PlatformLogo source="psn" />)
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  rerender(<PlatformLogo source="psn" label="PlayStation" />)
  expect(screen.getByRole('img', { name: 'PlayStation' })).toBeInTheDocument()
  rerender(<PlatformLogo source="steam" label="Steam" />)
  expect(screen.getByRole('img', { name: 'Steam' })).toBeInTheDocument()
  rerender(<PlatformLogo source="ra" label="RetroAchievements" />)
  expect(screen.getByRole('img', { name: 'RetroAchievements' })).toBeInTheDocument()
})
