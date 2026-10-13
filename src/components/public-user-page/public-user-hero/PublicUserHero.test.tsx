import { render, screen, fireEvent } from '@testing-library/react'
import PublicUserHero from './PublicUserHero'
import { en } from '@/translations/en'

jest.mock('../public-user-kpis/PublicUserKpis', () => ({ __esModule: true, default: () => <div data-testid="kpis" /> }))
jest.mock('@/components/user-page/user-profile-banner/UserProfileBanner', () => ({ __esModule: true, default: () => null }))

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
