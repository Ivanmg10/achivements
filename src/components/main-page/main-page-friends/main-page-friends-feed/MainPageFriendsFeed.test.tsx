import { render, screen } from '@testing-library/react'
import MainPageFriendsFeed from './MainPageFriendsFeed'
import type { FeedItem } from '@/utils/friends'
import { en } from '@/translations/en'

const ITEM = {
  username: 'ana',
  avatar: null,
  achievement: { Date: '2026-10-13 10:00:00', Title: 'Win', GameTitle: 'Portal', GameID: 620, AchievementID: 1, Source: 'steam', BadgeUrl: 'https://x/b.png' },
} as unknown as FeedItem

test("each unlock names who and where, and opens their progress in that game", () => {
  render(<MainPageFriendsFeed items={[ITEM]} isLoading={false} />)
  const link = screen.getByRole('link')
  expect(link).toHaveAttribute('href', '/user/ana/steam/620')
  expect(link).toHaveTextContent('Win')
  expect(link).toHaveTextContent('ana · Portal')
})

test('placeholders while loading, then a note when there is nothing', () => {
  const { container, unmount } = render(<MainPageFriendsFeed items={[]} isLoading />)
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  unmount()
  render(<MainPageFriendsFeed items={[]} isLoading={false} />)
  expect(screen.getByText(en.friends.feedEmpty)).toBeInTheDocument()
})

test('an unlock with no badge keeps its place', () => {
  const { container } = render(<MainPageFriendsFeed items={[{ ...ITEM, achievement: { ...ITEM.achievement, BadgeUrl: undefined, BadgeName: '' } }]} isLoading={false} />)
  expect(container.querySelector('img')).toBeNull()
})
