import { render, screen } from '@testing-library/react'
import PublicUserOverview from './PublicUserOverview'
import { useRaLinked } from '@/hooks/useRaLinked'

jest.mock('@/hooks/useRaLinked', () => ({ useRaLinked: jest.fn() }))
const stub = (id: string) => ({ __esModule: true, default: () => <div data-testid={id} /> })
jest.mock('@/components/ra-recently-played/RARecentlyPlayed', () => stub('ra-recent'))
jest.mock('@/components/recent-games-list/RecentGamesList', () => stub('recent'))
jest.mock('@/components/main-page/main-page-profile/MainPageProfile', () => stub('profile'))
jest.mock('../public-user-recent-unlocks/PublicUserRecentUnlocks', () => stub('unlocks'))
jest.mock('../public-user-platforms/PublicUserPlatforms', () => stub('platforms'))
jest.mock('../public-user-showcase/PublicUserShowcase', () => stub('showcase'))
jest.mock('../public-user-about/PublicUserAbout', () => stub('about'))

const USER = { username: 'ivan', avatar: null, description: null, location: null, ra: 'IvanRA', steam: true, psn: false }

test('every part of the first tab, with the RA feed when RA can be read', () => {
  ;(useRaLinked as jest.Mock).mockReturnValue(true)
  render(<PublicUserOverview user={USER} games={[]} gamesLoading={false} />)
  for (const id of ['ra-recent', 'profile', 'unlocks', 'platforms', 'showcase', 'about']) {
    expect(screen.getByTestId(id)).toBeInTheDocument()
  }
})

test('the Steam and PSN feed without RA', () => {
  ;(useRaLinked as jest.Mock).mockReturnValue(false)
  render(<PublicUserOverview user={USER} games={[]} gamesLoading={false} />)
  expect(screen.getByTestId('recent')).toBeInTheDocument()
  expect(screen.queryByTestId('ra-recent')).not.toBeInTheDocument()
})
