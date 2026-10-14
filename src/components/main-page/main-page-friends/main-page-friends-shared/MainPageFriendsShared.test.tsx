import { render, screen } from '@testing-library/react'
import MainPageFriendsShared from './MainPageFriendsShared'
import type { SharedGameRow } from '@/utils/friends'
import { en } from '@/translations/en'

const ROW: SharedGameRow = {
  game: { key: 'ra:1', source: 'ra', id: 1, title: 'Zelda', subtitle: 'SNES', status: 'playing', pct: 40, href: '' },
  friends: [
    { username: 'ana', avatar: 'https://x/a.png', pct: 100 },
    { username: 'bo', avatar: null, pct: 20 },
  ],
}

test('your progress, then each friend opening the two side by side', () => {
  render(<MainPageFriendsShared rows={[ROW]} isLoading={false} />)
  expect(screen.getByText(`RetroAchievements · ${en.userProfile.you} 40%`)).toBeInTheDocument()
  const ana = screen.getByRole('link', { name: `${en.friends.compareWith.replace('{u}', 'ana')} (100%)` })
  expect(ana).toHaveAttribute('href', '/user/ana/ra/1?compare=1')
  expect(ana).toHaveTextContent('100%')
  expect(screen.getByRole('link', { name: /bo/ })).toHaveAttribute('href', '/user/bo/ra/1?compare=1')
})

test('placeholders while loading, then a note when nothing is shared', () => {
  const { container, unmount } = render(<MainPageFriendsShared rows={[]} isLoading />)
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  unmount()
  render(<MainPageFriendsShared rows={[]} isLoading={false} />)
  expect(screen.getByText(en.friends.sharedEmpty)).toBeInTheDocument()
})
