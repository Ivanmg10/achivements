jest.mock('@/hooks/useXboxEnabled', () => ({ useXboxEnabled: jest.fn() }))
jest.mock('@/components/user-page/user-ra-card/UserRaCard', () => ({ __esModule: true, default: () => <section aria-label="RetroAchievements" /> }))
jest.mock('@/components/user-page/user-steam-card/UserSteamCard', () => ({ __esModule: true, default: () => <section aria-label="Steam" /> }))
jest.mock('@/components/user-page/user-psn-card/UserPsnCard', () => ({ __esModule: true, default: () => <section aria-label="PlayStation Network" /> }))
jest.mock('@/components/user-page/user-xbox-card/UserXboxCard', () => ({ __esModule: true, default: () => <section aria-label="Xbox" /> }))

import { render, screen } from '@testing-library/react'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import UserPlatforms from './UserPlatforms'

test('one card per platform, in order', () => {
  ;(useXboxEnabled as jest.Mock).mockReturnValue(true)
  render(<UserPlatforms />)
  expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))).toEqual([
    'RetroAchievements',
    'Steam',
    'PlayStation Network',
    'Xbox',
  ])
})
