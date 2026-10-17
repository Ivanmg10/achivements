import { render, screen } from '@testing-library/react'
import MainPagePinnedSectionGameTile from './MainPagePinnedSectionGameTile'
import type { LibraryGame } from '@/utils/library'

const game = (pct: number): LibraryGame => ({ key: 'psn:1', source: 'psn', id: 1, title: 'BO2', subtitle: 'PlayStation', iconUrl: 'https://i.png', status: 'playing', pct, href: '/psnGame/NPWR00000_01' })

test('a pinned game links to its page with its progress', () => {
  render(<MainPagePinnedSectionGameTile game={game(46)} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/psnGame/NPWR00000_01')
  expect(screen.getByText('BO2')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'BO2' })).toHaveAttribute('aria-valuenow', '46')
  expect(screen.getByText('46%')).not.toHaveClass('text-success')
})

test('a finished one has its percentage in green', () => {
  render(<MainPagePinnedSectionGameTile game={game(100)} />)
  expect(screen.getByText('100%')).toHaveClass('text-success')
})

test('the grip, when given, sits beside the link, not in it', () => {
  render(<MainPagePinnedSectionGameTile game={game(46)} handle={<button>grip</button>} />)
  expect(screen.getByRole('link')).not.toContainElement(screen.getByRole('button', { name: 'grip' }))
})
