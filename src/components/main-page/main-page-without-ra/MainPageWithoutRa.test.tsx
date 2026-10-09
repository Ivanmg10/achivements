import { render, screen } from '@testing-library/react'
import MainPageWithoutRa from './MainPageWithoutRa'
import { en } from '@/translations/en'

jest.mock('@/components/recent-games-list/RecentGamesList', () => ({
  __esModule: true,
  default: () => <div data-testid="steam-recent">recent</div>,
}))
jest.mock('../main-page-profile/MainPageProfile', () => ({
  __esModule: true,
  default: () => <div data-testid="steam-profile">profile</div>,
}))

test('shows the recent feed and the profile column', () => {
  render(<MainPageWithoutRa />)
  expect(screen.getByTestId('steam-recent')).toBeInTheDocument()
  expect(screen.getByTestId('steam-profile')).toBeInTheDocument()
})

test('links RetroAchievements right there, without going to settings', () => {
  render(<MainPageWithoutRa />)
  expect(screen.getByRole('button', { name: new RegExp(en.steam.connectRa) })).toBeInTheDocument()
})

test('puts the profile first in the DOM so it tops the page on mobile', () => {
  render(<MainPageWithoutRa />)
  const profile = screen.getByTestId('steam-profile')
  const recent = screen.getByTestId('steam-recent')
  expect(profile.compareDocumentPosition(recent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
