import { render, screen } from '@testing-library/react'
import CollectionNumbers from './CollectionNumbers'
import { en } from '@/translations/en'
import type { UserAwards } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import { formatPlaytime } from '@/utils/steamFeed'

const awards = {
  TotalAwardsCount: 27, MasteryAwardsCount: 7, CompletionAwardsCount: 2, BeatenHardcoreAwardsCount: 15,
  BeatenSoftcoreAwardsCount: 3, EventAwardsCount: 0, VisibleUserAwards: [],
} as UserAwards
const steam = (id: number, done: number) =>
  ({ id, title: `Steam ${id}`, imageIcon: '', maxPossible: 10, numAwarded: done, pctWon: done * 10, playtimeForever: 60, achievementsLoaded: true, hasStats: true }) as SteamGameProgress

test('a tile per platform, each with its headline and its bar with counts', () => {
  render(<CollectionNumbers awards={awards} steamGames={[steam(1, 10), steam(2, 4)]} />)
  expect(screen.getByRole('heading', { name: en.cards.yourNumbers })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'RetroAchievements' })).toHaveTextContent('7')
  const steamTile = screen.getByRole('region', { name: 'Steam' })
  expect(steamTile).toHaveTextContent('1')
  // Side by side, the distribution heading would repeat on every tile: it is left out, the counts stay.
  expect(steamTile).not.toHaveTextContent(en.charts.completionDistTitle)
  expect(steamTile).toHaveTextContent('100%1')
})

test('a platform with nothing to say is left out', () => {
  render(<CollectionNumbers awards={null} steamGames={[]} />)
  expect(screen.queryByRole('region', { name: 'RetroAchievements' })).not.toBeInTheDocument()
  expect(screen.queryByRole('region', { name: 'Steam' })).not.toBeInTheDocument()
})

test('PSN and Xbox get their own tiles when linked', () => {
  render(
    <CollectionNumbers
      awards={null}
      psnGames={[psnGameFixture({ pctWon: 100, earned: { bronze: 1, silver: 0, gold: 0, platinum: 0 }, defined: { bronze: 1, silver: 0, gold: 0, platinum: 0 } })]}
      xboxGames={[xboxGameFixture()]}
    />,
  )
  expect(screen.getByRole('region', { name: 'PlayStation' })).toHaveTextContent('1')
  expect(screen.getByRole('region', { name: 'Xbox' })).toBeInTheDocument()
})

test('one play-time total across Steam, PlayStation and Xbox, and none when none of them reports any', () => {
  const { rerender } = render(
    <CollectionNumbers
      awards={awards}
      steamGames={[steam(1, 10)]}
      psnGames={[psnGameFixture({ playtimeMinutes: 120, playedAs: ['A'] })]}
      xboxGames={[xboxGameFixture({ playtimeMinutes: 180 })]}
    />,
  )
  // 60 + 120 + 180 minutes
  const region = screen.getByRole('region', { name: en.steam.totalPlaytime })
  expect(region).toHaveTextContent(formatPlaytime(360, { minutes: en.steam.minutesShort, hours: en.steam.hoursShort }, 'en'))
  expect(region).toHaveTextContent(en.cards.playtimeSources)
  rerender(<CollectionNumbers awards={awards} />)
  expect(screen.queryByRole('region', { name: en.steam.totalPlaytime })).not.toBeInTheDocument()
})
