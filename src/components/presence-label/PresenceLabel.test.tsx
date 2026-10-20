import { render, screen } from '@testing-library/react'
import PresenceLabel from './PresenceLabel'
import PresenceDot from '@/components/presence-dot/PresenceDot'
import { en } from '@/translations/en'

test('online, seen a while ago, long ago, or the fallback', () => {
  const { rerender } = render(<PresenceLabel online lastSeenAt={new Date().toISOString()} fallback="bio" />)
  expect(screen.getByText(en.following.online)).toBeInTheDocument()

  rerender(<PresenceLabel online={false} lastSeenAt={new Date(Date.now() - 3 * 3600e3).toISOString()} fallback="bio" />)
  expect(screen.getByText(/^Seen .*3 hr/)).toBeInTheDocument()

  rerender(<PresenceLabel online={false} lastSeenAt="2020-01-01T00:00:00Z" fallback="bio" />)
  expect(screen.getByText(en.following.seenLongAgo)).toBeInTheDocument()

  rerender(<PresenceLabel online={false} lastSeenAt={null} fallback="bio" />)
  expect(screen.getByText('bio')).toBeInTheDocument()
})

test('the dot shows only while online, and speaks only when asked to', () => {
  const { container, rerender } = render(<PresenceDot online={false} />)
  expect(container).toBeEmptyDOMElement()

  rerender(<PresenceDot online />)
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')

  rerender(<PresenceDot online announce />)
  expect(screen.getByRole('img', { name: en.following.online })).toBeInTheDocument()
})
