import { render, screen } from '@testing-library/react'
import MainPageProfileNowPlaying from './MainPageProfileNowPlaying'

const props = { href: '/gameInfo/1', tintSrc: null, kicker: 'Playing now · level 2', icon: <span />, title: 'Spider-Man', sub: 'PS2' }

test('a link to the game with its kicker, title, console and share', () => {
  render(<MainPageProfileNowPlaying {...props} share="12.8 %" bar={<span role="progressbar" aria-label="bar" />} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/gameInfo/1')
  expect(screen.getByText('Playing now · level 2')).toBeInTheDocument()
  expect(screen.getByText('Spider-Man')).toBeInTheDocument()
  expect(screen.getByText('PS2')).toBeInTheDocument()
  expect(screen.getByText('12.8 %')).not.toHaveClass('text-success')
  expect(screen.getByRole('progressbar', { name: 'bar' })).toBeInTheDocument()
})

test('finished, the share turns to the success colour; unknown, it is left out', () => {
  const { rerender } = render(<MainPageProfileNowPlaying {...props} share="100 %" done />)
  expect(screen.getByText('100 %')).toHaveClass('text-success')
  rerender(<MainPageProfileNowPlaying {...props} share={null} />)
  expect(screen.queryByText(/%/)).toBeNull()
})
