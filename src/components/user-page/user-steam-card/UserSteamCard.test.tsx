jest.mock('@/hooks/useSteamLink', () => ({ useSteamLink: jest.fn() }))
jest.mock('@/hooks/useSteamProfile', () => ({ useSteamProfile: jest.fn(() => ({ profile: null })) }))
jest.mock('@/context/SteamGamesDataContext', () => ({ useSteamGamesData: () => ({ library: [], libraryLoading: false }) }))

import { render, screen } from '@testing-library/react'
import UserSteamCard from './UserSteamCard'
import { useSteamLink } from '@/hooks/useSteamLink'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { en } from '@/translations/en'

const LINK_HREF = '/api/auth/steam?intent=link&next=%2Fuser'
const unlink = jest.fn()

function setSteam(overrides: Record<string, unknown> = {}) {
  ;(useSteamLink as jest.Mock).mockReturnValue({
    steamId: '76561198000000000', steamUsername: 'ivan', isLinked: true, linkHref: LINK_HREF, unlink,
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  setSteam()
})

test('linked: its own numbers', () => {
  render(<UserSteamCard />)
  expect(screen.getByRole('region', { name: 'Steam' })).toHaveTextContent(en.steam.perfect)
})

test('its achievements are labelled in a capital, like Xbox', () => {
  render(<UserSteamCard />)
  expect(screen.getByText(en.userStats.achievements)).toBeInTheDocument()
})

test('shows the Steam profile picture and name once loaded', () => {
  ;(useSteamProfile as jest.Mock).mockReturnValue({ profile: { personaname: 'Palmera', avatarfull: 'https://avatars.steamstatic.com/abc_full.jpg' } })
  const { container } = render(<UserSteamCard />)
  expect(screen.getByRole('region', { name: 'Steam' })).toHaveTextContent('Palmera')
  expect(container.querySelector('img[src*="avatars.steamstatic.com"]')).not.toBeNull()
})

test('not linked: a link that goes through Steam to connect', () => {
  setSteam({ isLinked: false, steamId: null })
  render(<UserSteamCard />)
  expect(screen.getByRole('link', { name: en.userData.steamConnect })).toHaveAttribute('href', LINK_HREF)
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})
