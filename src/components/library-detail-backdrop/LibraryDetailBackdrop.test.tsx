jest.mock('@/components/library-shelf-banner/LibraryShelfBanner', () => ({
  __esModule: true,
  default: ({ entry }: { entry: { key: string } }) => <div data-testid="banner">{entry.key}</div>,
}))

import { render, screen } from '@testing-library/react'
import LibraryDetailBackdrop from './LibraryDetailBackdrop'
import { libraryEntry } from '@/test-utils/libraryFixtures'

test('draws the art of the game, blurred, at the top of its card', () => {
  render(<LibraryDetailBackdrop entry={libraryEntry('steam', 7, 'Hades')} />)
  expect(screen.getByTestId('banner')).toHaveTextContent('steam:7')
  expect(screen.getByTestId('banner').parentElement).toHaveClass('blur-lg')
})

test('sits behind what is written on the card, answers no clicks, and is hidden from assistive technology', () => {
  const { container } = render(<LibraryDetailBackdrop entry={libraryEntry('steam', 7, 'Hades')} />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(container.firstElementChild).toHaveClass('-z-10', 'pointer-events-none', 'absolute', 'top-0')
})

test('fades into the colour of the card toward the bottom, so a taller card is the same all the way down', () => {
  const { container } = render(<LibraryDetailBackdrop entry={libraryEntry('steam', 7, 'Hades')} />)
  expect(container.querySelector('[class*="bg-linear-to-b"]')?.className).toMatch(/to-bg-card/)
})

test('another game takes the place of the one before', () => {
  const { rerender } = render(<LibraryDetailBackdrop entry={libraryEntry('steam', 7, 'Hades')} />)
  rerender(<LibraryDetailBackdrop entry={libraryEntry('ra', 5, 'Sonic')} />)
  expect(screen.getByTestId('banner')).toHaveTextContent('ra:5')
})

test('clips the scaled, blurred art to its box, so nothing spills past the fade as a hard band', () => {
  const { container } = render(<LibraryDetailBackdrop entry={libraryEntry('steam', 7, 'Hades')} />)
  expect(container.firstElementChild).toHaveClass('overflow-hidden')
})
