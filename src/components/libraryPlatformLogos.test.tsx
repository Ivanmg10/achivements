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
    expect(container.firstElementChild).toHaveClass('text-xs', 'px-2')
  })

  test('is a plain tag in a list row: the name with the logo, and on a phone only the logo (#129)', () => {
    const { container } = render(<LibraryPlatformBadge source="steam" size="tag" />)
    expect(screen.getByText('Steam')).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeNull()
    expect(screen.getByText('Steam')).toHaveClass('max-sm:sr-only')
  })

  test('in a list row it names the console, and its logo says the platform aloud (#169)', () => {
    render(<LibraryPlatformBadge source="psn" size="tag" label="PS4" />)
    expect(screen.getByText('PS4')).toBeInTheDocument()
    expect(screen.getByLabelText('PlayStation')).toBeInTheDocument()
  })
})

describe('the platform tabs', () => {
  const counts = { ra: 12, steam: 30, psn: 4, xbox: 0 }

  test('are words with their counts, as the tabs of the library', () => {
    render(<LibraryPlatformTabs value="all" counts={counts} onChange={jest.fn()} />)
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['All46', 'RetroAchievements12', 'Steam30', 'PlayStation4'])
    expect(screen.getByRole('tab', { name: /^Steam/ }).querySelector('img')).toBeNull()
  })
})
