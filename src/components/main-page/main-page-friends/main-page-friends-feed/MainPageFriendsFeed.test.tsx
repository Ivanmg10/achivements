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
  render(<MainPageFriendsFeed items={[ITEM]} />)
  const link = screen.getByRole('link')
  expect(link).toHaveAttribute('href', '/user/ana/steam/620')
  expect(link).toHaveTextContent('Win')
  expect(link).toHaveTextContent('ana · Portal')
})

test('a note when there is nothing', () => {
  render(<MainPageFriendsFeed items={[]} />)
  expect(screen.getByText(en.friends.feedEmpty)).toBeInTheDocument()
  // It fills the card's height, centred, when the card is stretched beside a taller column.
  expect(screen.getByText(en.friends.feedEmpty).parentElement).toHaveClass('flex-1')
})

test('an unlock with no badge keeps its place', () => {
  const { container } = render(<MainPageFriendsFeed items={[{ ...ITEM, achievement: { ...ITEM.achievement, BadgeUrl: undefined, BadgeName: '' } }]} />)
  expect(container.querySelector('img')).toBeNull()
})
