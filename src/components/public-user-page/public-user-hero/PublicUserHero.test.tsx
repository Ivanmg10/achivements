import { render, screen, fireEvent } from '@testing-library/react'
import PublicUserHero from './PublicUserHero'
import { en } from '@/translations/en'

jest.mock('../public-user-kpis/PublicUserKpis', () => ({ __esModule: true, default: () => <div data-testid="kpis" /> }))
jest.mock('@/components/user-page/user-profile-banner/UserProfileBanner', () => ({ __esModule: true, default: () => null }))
jest.mock('../public-user-follow-button/PublicUserFollowButton', () => ({
  __esModule: true,
  default: ({ initial }: { initial: boolean }) => <span data-testid="follow" data-initial={String(initial)} />,
}))

const USER = { username: 'ivan', avatar: 'https://x/a.png', description: 'Hello there', location: 'ES', ra: 'IvanRA', steam: false, psn: false }

test('who they are: name, country, bio, platforms and pace', () => {
  render(<PublicUserHero user={USER} onCompare={jest.fn()} />)
  expect(screen.getByRole('heading', { level: 1, name: 'ivan' })).toBeInTheDocument()
  expect(screen.getByText('Spain')).toBeInTheDocument()
  expect(screen.getByText('Hello there')).toBeInTheDocument()
  expect(screen.getByText('IvanRA')).toBeInTheDocument()
  expect(screen.getByTestId('kpis')).toBeInTheDocument()
})

test('someone else: compare and copy the link', () => {
  const onCompare = jest.fn()
  render(<PublicUserHero user={USER} onCompare={onCompare} />)
  fireEvent.click(screen.getByRole('button', { name: en.userProfile.compareWithMe }))
  expect(onCompare).toHaveBeenCalled()
  expect(screen.getByRole('button', { name: en.userProfile.copyLink })).toBeInTheDocument()
  expect(screen.queryByText(en.userProfile.yourProfile)).not.toBeInTheDocument()
})

test('your own: marked as yours, with the way to edit it instead of comparing', () => {
  render(<PublicUserHero user={{ ...USER, isSelf: true }} onCompare={jest.fn()} />)
  expect(screen.getByText(en.userProfile.yourProfile)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.userProfile.editProfile })).toHaveAttribute('href', '/user')
  expect(screen.queryByRole('button', { name: en.userProfile.compareWithMe })).not.toBeInTheDocument()
})

test('no avatar, no country, no platforms: a placeholder and no numbers', () => {
  render(<PublicUserHero user={{ ...USER, avatar: null, location: null, description: null, ra: null }} />)
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(screen.queryByTestId('kpis')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: en.userProfile.compareWithMe })).not.toBeInTheDocument()
})

test('follow someone else, starting from whether you already do; not yourself', () => {
  const { unmount } = render(<PublicUserHero user={{ ...USER, following: true }} onCompare={jest.fn()} />)
  expect(screen.getByTestId('follow')).toHaveAttribute('data-initial', 'true')
  unmount()
  render(<PublicUserHero user={{ ...USER, isSelf: true }} onCompare={jest.fn()} />)
  expect(screen.queryByTestId('follow')).not.toBeInTheDocument()
})

test('someone else online says so; on your own page it says nothing', () => {
  const { unmount } = render(<PublicUserHero user={{ ...USER, online: true, lastSeenAt: new Date().toISOString() }} onCompare={jest.fn()} />)
  expect(screen.getByText(en.following.online)).toBeInTheDocument()
  unmount()
  render(<PublicUserHero user={{ ...USER, isSelf: true, online: true, lastSeenAt: new Date().toISOString() }} />)
  expect(screen.queryByText(en.following.online)).not.toBeInTheDocument()
})
