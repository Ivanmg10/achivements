import { render, screen } from '@testing-library/react'
import LibraryPlatformBadge from './library-platform-badge/LibraryPlatformBadge'
import LibraryPlatformTabs from './library-platform-tabs/LibraryPlatformTabs'

describe('the platform badge', () => {
  test('has the logo of the platform and its name', () => {
    const { container } = render(<LibraryPlatformBadge source="steam" />)
    expect(screen.getByText('Steam')).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  test('is bigger beside the name of the game that is open', () => {
    const { container, rerender } = render(<LibraryPlatformBadge source="psn" />)
    const small = container.firstElementChild!.className
    rerender(<LibraryPlatformBadge source="psn" size="lg" />)
    expect(container.firstElementChild!.className).not.toBe(small)
    expect(container.firstElementChild).toHaveClass('text-xs', 'px-3')
  })
})

describe('the platform tabs', () => {
  const counts = { ra: 12, steam: 30, psn: 4 }

  test('every platform carries its logo, and "all" has none', () => {
    render(<LibraryPlatformTabs value="all" counts={counts} onChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: /^All/ }).querySelector('svg, img')).toBeNull()
    expect(screen.getByRole('button', { name: /^Steam/ }).querySelector('svg')).not.toBeNull()
    expect(screen.getByRole('button', { name: /^PlayStation/ }).querySelector('svg')).not.toBeNull()
    expect(screen.getByRole('button', { name: /^RetroAchievements/ }).querySelector('svg, img')).not.toBeNull()
  })
})
