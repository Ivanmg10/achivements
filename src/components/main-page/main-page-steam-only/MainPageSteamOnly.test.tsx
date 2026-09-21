import { render, screen } from '@testing-library/react'
import MainPageSteamOnly from './MainPageSteamOnly'
import { en } from '@/translations/en'

jest.mock('@/components/steam/steam-recent-list/SteamRecentList', () => ({
  __esModule: true,
  default: () => <div data-testid="steam-recent">recent</div>,
}))
jest.mock('../main-page-profile/main-page-profile-st/MainPageProfileSt', () => ({
  __esModule: true,
  default: () => <div data-testid="steam-profile">profile</div>,
}))

test('shows the Steam recent feed and profile', () => {
  render(<MainPageSteamOnly />)
  expect(screen.getByTestId('steam-recent')).toBeInTheDocument()
  expect(screen.getByTestId('steam-profile')).toBeInTheDocument()
})

test('points to settings to link RetroAchievements too', () => {
  render(<MainPageSteamOnly />)
  expect(screen.getByText(en.steam.steamOnlyHint)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: en.steam.connectRa }).getAttribute('href')).toBe('/user')
})

test('puts the profile first in the DOM so it tops the page on mobile', () => {
  render(<MainPageSteamOnly />)
  const profile = screen.getByTestId('steam-profile')
  const recent = screen.getByTestId('steam-recent')
  expect(profile.compareDocumentPosition(recent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
