import { render, screen } from '@testing-library/react'
import GameCompareTableCell from './GameCompareTableCell'
import { en } from '@/translations/en'

test('an unlock with its day, and its tags in words', () => {
  render(<GameCompareTableCell who="ivan" unlock={{ earned: true, earnedAt: '2025-10-03 12:00:00', hardcore: true }} first />)
  expect(screen.getByText('ivan')).toBeInTheDocument()
  expect(screen.getByText('Oct 3, 2025')).toBeInTheDocument()
  expect(screen.getByText(en.userGame.hardcore)).toBeInTheDocument()
  expect(screen.getByText(en.userGame.first)).toBeInTheDocument()
})

test('not earned, or no data at all, is a lock and no tags', () => {
  const { unmount } = render(<GameCompareTableCell who="you" unlock={null} first />)
  expect(screen.getByText(en.userGame.notEarned)).toBeInTheDocument()
  expect(screen.queryByText(en.userGame.first)).not.toBeInTheDocument()
  unmount()
  render(<GameCompareTableCell who="you" unlock={{ earned: false, earnedAt: null }} />)
  expect(screen.getByText(en.userGame.notEarned)).toBeInTheDocument()
})

test('while loading, no answer yet', () => {
  render(<GameCompareTableCell who="you" unlock={null} loading />)
  expect(screen.queryByText(en.userGame.notEarned)).not.toBeInTheDocument()
})
