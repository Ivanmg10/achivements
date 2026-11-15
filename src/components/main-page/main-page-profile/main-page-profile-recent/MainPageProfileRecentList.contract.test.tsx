import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import MainPageProfileRaAchievements from '../main-page-profile-ra/main-page-profile-ra-achievements/MainPageProfileRaAchievements'
import MainPageProfileStAchievements from '../main-page-profile-st/main-page-profile-st-achievements/MainPageProfileStAchievements'
import MainPageProfilePsnTrophies from '../main-page-profile-psn/main-page-profile-psn-trophies/MainPageProfilePsnTrophies'
import MainPageProfileXboxAchievements from '../main-page-profile-xbox/main-page-profile-xbox-achievements/MainPageProfileXboxAchievements'
import { xboxRecentFixture } from '@/test-utils/xboxFixtures'
import { en } from '@/translations/en'
import type { RecentAchievement } from '@/types/types'

type Platform = {
  name: string
  /** Where unlock 1 opens, on the game's page. */
  href: string
  /** The failure line, and the retry button's name (RA's list has no retry). */
  failure?: { text: string; retry: string }
  row: (p: { count: number; isLoading?: boolean; failed?: boolean; onRetry?: () => void }) => ReactElement
}

const AT = '2026-01-02T12:00:00.000Z'
const upTo = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

const PLATFORMS: Platform[] = [
  {
    name: 'RetroAchievements',
    href: '/gameInfo/10',
    row: ({ count, isLoading }) => (
      <MainPageProfileRaAchievements
        isLoading={isLoading}
        achievements={upTo(count).map((n) => ({ AchievementID: n, GameID: 10, GameTitle: 'Sly Cooper', Title: `Unlock ${n}`, BadgeName: 'b', Points: 5, HardcoreMode: '0', Date: '2026-01-02 12:00:00' }) as RecentAchievement)}
      />
    ),
  },
  {
    name: 'Steam',
    href: '/steamGame/377160#ach-A1',
    failure: { text: en.steam.achievementsError, retry: en.steam.retry },
    row: ({ count, isLoading, failed, onRetry = jest.fn() }) => (
      <MainPageProfileStAchievements
        isLoading={!!isLoading}
        error={failed ? 'failed' : null}
        onRetry={onRetry}
        achievements={upTo(count).map((n) => ({ appId: 377160, gameTitle: 'Fallout 4', apiname: `A${n}`, title: `Unlock ${n}`, badgeUrl: '', unlockedAt: AT }))}
      />
    ),
  },
  {
    name: 'PlayStation',
    href: '/psnGame/NPWR20188_00#trophy-1',
    failure: { text: en.psn.trophiesError, retry: en.psn.retry },
    row: ({ count, isLoading, failed, onRetry = jest.fn() }) => (
      <MainPageProfilePsnTrophies
        isLoading={!!isLoading}
        error={failed ? 'failed' : null}
        onRetry={onRetry}
        trophies={upTo(count).map((n) => ({ gameId: 2018800, titleId: 'NPWR20188_00', gameTitle: 'Astro Bot', gameIconUrl: '', trophyId: n, name: `Unlock ${n}`, iconUrl: null, type: 'gold' as const, earnedAt: AT, rarity: null }))}
      />
    ),
  },
  {
    name: 'Xbox',
    href: '/xboxGame/1738914043#achievement-1',
    failure: { text: en.xbox.achievementsError, retry: en.xbox.retry },
    row: ({ count, isLoading, failed, onRetry = jest.fn() }) => (
      <MainPageProfileXboxAchievements
        isLoading={!!isLoading}
        error={failed ? 'failed' : null}
        onRetry={onRetry}
        achievements={upTo(count).map((n) => xboxRecentFixture({ achievementId: String(n), name: `Unlock ${n}`, gamerscore: n * 10 }))}
      />
    ),
  },
]

describe.each(PLATFORMS)('the latest unlocks under a profile: $name', (p) => {
  test('lists the latest three, each opening on its game page with the day beside the game', () => {
    const { container } = render(p.row({ count: 8 }))
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveTextContent('Unlock 1')
    expect(links[0]).toHaveAttribute('href', expect.stringContaining(p.href.split('#')[0]))
    expect(container.querySelector('time')).toHaveAttribute('dateTime')
  })

  test('says so when nothing is earned yet, and keeps its room', () => {
    const { container } = render(p.row({ count: 0 }))
    expect(screen.getByText(en.cards.noEarned)).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('min-h-[12rem]')
  })

  test('shows placeholders while loading, but keeps a list it has during a refresh', () => {
    const { container, unmount } = render(p.row({ count: 0, isLoading: true }))
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    unmount()
    const refreshed = render(p.row({ count: 2, isLoading: true }))
    expect(refreshed.container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })
})

describe.each(PLATFORMS.filter((p) => p.failure))('a failed read of the latest unlocks: $name', (p) => {
  test('is said as an alert and can be asked again', () => {
    const onRetry = jest.fn()
    render(p.row({ count: 0, failed: true, onRetry }))
    expect(screen.getByRole('alert')).toHaveTextContent(p.failure!.text)
    fireEvent.click(screen.getByRole('button', { name: p.failure!.retry }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
