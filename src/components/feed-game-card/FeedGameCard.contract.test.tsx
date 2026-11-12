jest.mock('@/components/psn/psn-recently-played-expanded/PsnRecentlyPlayedExpanded', () => ({ __esModule: true, default: () => <div data-testid="panel" /> }))
jest.mock('@/components/xbox/xbox-recently-played-expanded/XboxRecentlyPlayedExpanded', () => ({ __esModule: true, default: () => <div data-testid="panel" /> }))
jest.mock('@/components/steam/steam-recently-played-expanded/SteamRecentlyPlayedExpanded', () => ({ __esModule: true, default: () => <div data-testid="panel" /> }))
jest.mock('@/components/psn/psn-collection-expanded/PsnCollectionExpanded', () => ({ __esModule: true, default: () => <div data-testid="panel" /> }))
jest.mock('@/components/pin-toggle-button/PinToggleButton', () => ({
  PinToggleButton: ({ gameId, source = 'ra' }: { gameId: number; source?: string }) => <span data-testid="pin">{source}:{gameId}</span>,
}))

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import { psnGameFixture } from '@/test-utils/psnFixtures'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'
import { toSteamGameProgress } from '@/utils/steamMappers'
import type { RecentlyPlayedGame } from '@/types/types'
import RaGameItem from '@/components/ra-game-item/RaGameItem'
import SteamGameItem from '@/components/steam/steam-game-item/SteamGameItem'
import PsnGameItem from '@/components/psn/psn-game-item/PsnGameItem'
import XboxGameItem from '@/components/xbox/xbox-game-item/XboxGameItem'
import PsnCollectionItem from '@/components/psn/psn-collection-item/PsnCollectionItem'

/**
 * What every platform's row in the recent feed promises (the shell, `FeedGameCard`), tested through each
 * adapter as a person uses it. A platform's own extras (RA's points, Steam's two-step counts, Xbox's
 * gamerscore, PSN's platinum mark) are in its adapter's test.
 */

type Spec = { title: string; pct?: number; minutes?: number; lastPlayed?: string }

type Props = { expanded?: boolean; onToggle?: () => void }

type Platform = {
  name: string
  render: (spec: Spec, props?: Props) => void
  /** Where the title and icon go; absent where the row opens as a whole (a collection). */
  href?: string
  platform: string
  /** What the pin is for, as the mock prints it; absent where the row has none. */
  pin?: string
  expand: { show: string; hide: string }
  /** RA is always controlled by the feed; the others keep their own state when the feed does not. */
  controlled?: boolean
  /** Shows play time where the platform has it (Steam's own test: it always has some). */
  playtime?: boolean
}

const when = (s: Spec) => s.lastPlayed ?? '2026-01-02T00:00:00Z'

const RA: Platform = {
  name: 'RetroAchievements',
  controlled: true,
  render: (s, p) => {
    const total = 100
    const game: RecentlyPlayedGame = {
      GameID: 42, Title: s.title, ImageIcon: '/Images/001.png', ConsoleName: 'Game Boy Advance', LastPlayed: when(s).replace('T', ' ').slice(0, 19),
      NumPossibleAchievements: total, PossibleScore: 600, NumAchieved: s.pct ?? 0, ScoreAchieved: 0, NumAchievedHardcore: s.pct ?? 0, ScoreAchievedHardcore: 0,
    }
    render(<RaGameItem game={game} expanded={!!p?.expanded} onToggle={p?.onToggle ?? (() => {})}><div data-testid="panel" /></RaGameItem>)
  },
  href: '/gameInfo/42',
  platform: 'Game Boy Advance',
  pin: 'ra:42',
  expand: { show: en.cards.showAchievements, hide: en.cards.hideAchievements },
}

const STEAM: Platform = {
  name: 'Steam',
  render: (s, p) =>
    render(
      <SteamGameItem
        game={{
          ...toSteamGameProgress({ appid: 620, name: s.title, playtime_forever: s.minutes ?? 0, has_community_visible_stats: true, img_icon_url: 'h', rtime_last_played: Date.parse(when(s)) / 1000 }),
          achievementsLoaded: true, maxPossible: 100, numAwarded: s.pct ?? 0, pctWon: s.pct ?? 0,
        }}
        {...p}
      />,
    ),
  href: '/steamGame/620',
  platform: 'Steam',
  pin: 'steam:620',
  expand: { show: en.cards.showAchievements, hide: en.cards.hideAchievements },
}

const PSN: Platform = {
  name: 'PlayStation',
  playtime: true,
  render: (s, p) =>
    render(<PsnGameItem game={psnGameFixture({ id: 100, titleId: 'NPWR00001_00', title: s.title, consoleName: 'PS5', maxPossible: 100, numAwarded: s.pct ?? 0, pctWon: s.pct ?? 0, playtimeMinutes: s.minutes ?? null, lastPlayed: when(s) })} {...p} />),
  href: '/psnGame/NPWR00001_00',
  platform: 'PS5',
  pin: 'psn:100',
  expand: { show: en.psn.showTrophies, hide: en.psn.hideTrophies },
}

const XBOX: Platform = {
  name: 'Xbox',
  playtime: true,
  render: (s, p) =>
    render(<XboxGameItem game={xboxGameFixture({ id: 1738914043, titleId: '1738914043', title: s.title, consoleName: 'Xbox Series', maxPossible: 100, numAwarded: s.pct ?? 0, totalKnown: true, pctWon: s.pct ?? 0, playtimeMinutes: s.minutes ?? null, lastPlayed: when(s) })} {...p} />),
  href: '/xboxGame/1738914043',
  platform: 'Xbox Series',
  pin: 'xbox:1738914043',
  expand: { show: en.xbox.showAchievements, hide: en.xbox.hideAchievements },
}

const COLLECTION: Platform = {
  name: 'PlayStation collection',
  playtime: true,
  render: (s, p) => {
    const collection = { titleId: 'CUSA04893_00', title: s.title, iconUrl: 'https://c.png', heroUrl: null, lastPlayed: when(s), playtimeMinutes: s.minutes ?? null }
    const games = [psnGameFixture({ id: 1, title: 'One', consoleName: 'PS4', maxPossible: 50, numAwarded: (s.pct ?? 0) / 2, pctWon: s.pct ?? 0, collection })]
    // Two sets of 50 trophies: half of what is asked for in each makes the collection's share.
    games.push(psnGameFixture({ id: 2, title: 'Two', consoleName: 'PS4', maxPossible: 50, numAwarded: (s.pct ?? 0) / 2, pctWon: s.pct ?? 0, collection }))
    render(<PsnCollectionItem collection={collection} games={games} {...p} />)
  },
  platform: 'PS4',
  expand: { show: en.psn.showGames, hide: en.psn.hideGames },
}

const PLATFORMS = [RA, STEAM, PSN, XBOX, COLLECTION]

afterEach(cleanup)

describe.each(PLATFORMS)('$name feed row', (p) => {
  test('names the game and its platform, and shows its progress', () => {
    p.render({ title: 'Astro Bot', pct: 40 })
    expect(screen.getByText('Astro Bot')).toBeInTheDocument()
    expect(screen.getByText(p.platform)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Astro Bot' })).toHaveAttribute('aria-valuenow', '40')
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  test('says when it was last played', () => {
    p.render({ title: 'Astro Bot', lastPlayed: '2025-01-15T12:00:00Z' })
    expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument()
  })

  test('keeps its panel closed until it is opened, and the button says which way it goes', () => {
    p.render({ title: 'Astro Bot' }, p.controlled ? { expanded: false } : undefined)
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument()
    const button = screen.getByRole('button', { name: `${p.expand.show}: Astro Bot` })
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  test('opened by the feed, it shows the panel and asks the feed to close it', () => {
    const onToggle = jest.fn()
    p.render({ title: 'Astro Bot' }, { expanded: true, onToggle })
    expect(screen.getByTestId('panel')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: `${p.expand.hide}: Astro Bot` })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-controls', screen.getByTestId('panel').parentElement!.id)
    fireEvent.click(button)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  test('nothing interactive sits inside the expand button (a pin or a link would nest a control)', () => {
    p.render({ title: 'Astro Bot' }, p.controlled ? { expanded: false } : undefined)
    expect(screen.getByRole('button', { name: `${p.expand.show}: Astro Bot` }).querySelector('a, button')).toBeNull()
  })

  test('a row the feed does not control opens and closes itself', () => {
    if (p.controlled) return
    p.render({ title: 'Astro Bot' })
    fireEvent.click(screen.getByRole('button', { name: `${p.expand.show}: Astro Bot` }))
    expect(screen.getByTestId('panel')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: `${p.expand.hide}: Astro Bot` }))
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument()
  })
})

describe.each(PLATFORMS.filter((p) => p.href))('$name game link', (p) => {
  test('the title goes to the game page, and the icon beside it is kept out of the tab order', () => {
    p.render({ title: 'Astro Bot' })
    expect(screen.getByRole('link', { name: 'Astro Bot' })).toHaveAttribute('href', p.href)
    // The icon goes to the same place: a second link to it would be heard twice.
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})

describe('a collection has no page of its own', () => {
  test('its title is not a link, and the whole row opens', () => {
    COLLECTION.render({ title: 'Ezio Collection' })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pin')).not.toBeInTheDocument()
  })
})

describe.each(PLATFORMS.filter((p) => p.pin))('$name pin', (p) => {
  test('is the pin of this game on this platform', () => {
    p.render({ title: 'Astro Bot' })
    expect(screen.getByTestId('pin')).toHaveTextContent(p.pin!)
  })
})

describe.each(PLATFORMS.filter((p) => p.playtime))('$name play time', (p) => {
  const played = () => screen.queryByText(`${en.steam.playtime}:`, { exact: false })

  test('is shown when the platform gave it, with its label for a screen reader', () => {
    p.render({ title: 'Astro Bot', minutes: 125 })
    expect(played()?.parentElement).toHaveTextContent(`2.1 ${en.steam.hoursShort}`)
  })

  test('is left out when it did not', () => {
    p.render({ title: 'Astro Bot' })
    expect(played()).not.toBeInTheDocument()
  })
})
