jest.mock('@/hooks/useAchievementPins', () => ({ ...jest.requireActual('@/hooks/useAchievementPins'), useAchievementPins: jest.fn() }))

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { en } from '@/translations/en'
import { useAchievementPins, RA_PINS, STEAM_PINS, PSN_PINS, XBOX_PINS } from '@/hooks/useAchievementPins'
import { mockPins } from '@/test-utils/pins'
import { xboxAchievementFixture } from '@/test-utils/xboxFixtures'
import type { RetroAchievement } from '@/types/types'
import type { SteamAchievementUnified } from '@/types/steam'
import type { PsnTrophy } from '@/types/psn'
import GameInfoTable from '@/components/game-info-table/GameInfoTable'
import SteamGameInfoTable from '@/components/steam/steam-game-info-table/SteamGameInfoTable'
import PsnGameInfoTable from '@/components/psn/psn-game-info-table/PsnGameInfoTable'
import XboxGameInfoTable from '@/components/xbox/xbox-game-info-table/XboxGameInfoTable'

/**
 * What every platform's game page table promises (the shell, `AchievementTable`),
 * tested through each adapter as a person uses it. A platform's own extras
 * (PSN's DLC tabs, Xbox's gamerscore, RA's points…) are in its adapter's test.
 */

/** One achievement, in words any platform can be built from; its place in the list is its game order. */
type Spec = { title: string; earned?: boolean; at?: string; rarity?: number; secret?: boolean; text?: string; noticed?: boolean }

type Platform = {
  name: string
  render: (specs: Spec[]) => void
  /** The viewer's pins, by place in the list; returns the toggle the pin buttons call. */
  pins: (o: { canPin?: boolean; pinned?: number[]; leading?: number[] }) => jest.Mock
  /** What the toggle receives for the achievement with this title. */
  pinArg: (title: string) => unknown
  texts: { none: string; earned: string; locked: string }
  /** The words a still-secret one shows; absent where the platform has none (RA). */
  secret?: { title: string; reveal?: { one: string; all: string; allOff: string } }
  /** The `#fragment` a link to the achievement at that place uses; absent where links land on the page only (RA). */
  anchor?: (i: number) => string
  hasNotice: boolean
}

const day = (at = '2026-01-01') => `${at}T12:00:00Z`
const order = (i: number) => i + 1

const RA: Platform = {
  name: 'RetroAchievements',
  render: (specs) => {
    const list: RetroAchievement[] = specs.map((s, i) => ({
      ID: order(i), Title: s.title, Description: s.text ?? `${s.title} text`, BadgeName: `b${i}`, Points: 5, TrueRatio: 5,
      NumAwarded: s.rarity ?? 50, NumAwardedHardcore: 1, Author: 'a', AuthorULID: 'u', DateModified: '', DateCreated: '',
      DisplayOrder: order(i), MemAddr: '', Type: s.noticed ? 'missable' : null,
      DateEarned: s.earned ? `${s.at ?? '2026-01-01'} 12:00:00` : null, DateEarnedHardcore: null,
    }))
    const gameData = { ID: 9, Title: 'Game', NumDistinctPlayers: 100, Achievements: Object.fromEntries(list.map((a) => [a.ID, a])) }
    render(<GameInfoTable gameData={gameData as never} />)
  },
  pins: ({ canPin = true, pinned = [], leading = pinned }) => {
    const { toggle, value } = mockPins(RA_PINS.idOf, { canPin, pinned: pinned.map(order), leading: leading.map(order) })
    ;(useAchievementPins as jest.Mock).mockReturnValue(value)
    return toggle
  },
  pinArg: (title) => expect.objectContaining({ Title: title }),
  texts: { none: en.gameInfoTable.noMatches, earned: en.gameInfoTable.headerEarned, locked: en.achievementDetail.notEarned },
  hasNotice: true,
}

const STEAM: Platform = {
  name: 'Steam',
  render: (specs) => {
    const list: SteamAchievementUnified[] = specs.map((s, i) => ({
      _source: 'steam', id: `K${i}`, apiname: `K${i}`, title: s.title, description: s.text ?? `${s.title} text`, badgeUrl: `${i}.jpg`,
      displayOrder: i, hidden: !!s.secret, earned: !!s.earned, dateEarned: s.earned ? day(s.at) : null, globalPct: s.rarity ?? null, likelyOnline: !!s.noticed,
    }))
    render(<SteamGameInfoTable achievements={list} appId={620} gameTitle="Game" />)
  },
  pins: ({ canPin = true, pinned = [], leading = pinned }) => {
    const { toggle, value } = mockPins(STEAM_PINS.idOf, { canPin, pinned: pinned.map((i) => `K${i}`), leading: leading.map((i) => `K${i}`) })
    ;(useAchievementPins as jest.Mock).mockReturnValue(value)
    return toggle
  },
  pinArg: (title) => expect.objectContaining({ title }),
  texts: { none: en.steam.noAchievements, earned: en.steam.earned, locked: en.steam.locked },
  secret: { title: en.steam.hiddenAchievement },
  anchor: (i) => `ach-K${i}`,
  hasNotice: true,
}

const PSN: Platform = {
  name: 'PlayStation',
  render: (specs) => {
    const list: PsnTrophy[] = specs.map((s, i) => ({
      id: i, name: s.title, detail: s.text ?? `${s.title} text`, iconUrl: `https://i/${i}.png`, type: 'bronze', groupId: 'default',
      hidden: !!s.secret, earned: !!s.earned, earnedAt: s.earned ? day(s.at) : null, rarity: s.rarity ?? null,
    }))
    render(<PsnGameInfoTable trophies={list} gameId={100} gameTitle="Game" />)
  },
  pins: ({ canPin = true, pinned = [], leading = pinned }) => {
    const { toggle, value } = mockPins(PSN_PINS.idOf, { canPin, pinned, leading })
    ;(useAchievementPins as jest.Mock).mockReturnValue(value)
    return toggle
  },
  pinArg: (title) => expect.objectContaining({ name: title }),
  texts: { none: en.psn.noTrophies, earned: en.psn.earned, locked: en.psn.locked },
  secret: { title: en.psn.hiddenTrophy, reveal: { one: en.psn.revealTrophy, all: en.psn.showHiddenTrophies, allOff: en.psn.hideHiddenTrophies } },
  anchor: (i) => `trophy-${i}`,
  hasNotice: false,
}

const XBOX: Platform = {
  name: 'Xbox',
  render: (specs) => {
    const list = specs.map((s, i) =>
      xboxAchievementFixture({
        id: String(100 + i), name: s.title, description: s.text ?? `${s.title} text`, secret: !!s.secret,
        unlocked: !!s.earned, unlockedAt: s.earned ? day(s.at) : null, rarity: s.rarity ?? null,
      }),
    )
    render(<XboxGameInfoTable achievements={list} gameId={100} gameTitle="Game" />)
  },
  pins: ({ canPin = true, pinned = [], leading = pinned }) => {
    const { toggle, value } = mockPins(XBOX_PINS.idOf, { canPin, pinned: pinned.map((i) => String(100 + i)), leading: leading.map((i) => String(100 + i)) })
    ;(useAchievementPins as jest.Mock).mockReturnValue(value)
    return toggle
  },
  pinArg: (title) => expect.objectContaining({ name: title }),
  texts: { none: en.xbox.noAchievements, earned: en.xbox.earned, locked: en.xbox.locked },
  secret: { title: en.xbox.secretAchievement, reveal: { one: en.xbox.revealAchievement, all: en.xbox.showSecretAchievements, allOff: en.xbox.hideSecretAchievements } },
  anchor: (i) => `achievement-${100 + i}`,
  hasNotice: false,
}

const PLATFORMS = [RA, STEAM, PSN, XBOX]

const FOUR: Spec[] = [
  { title: 'Alpha', earned: true, at: '2026-01-03', rarity: 2 },
  { title: 'Bravo', earned: true, at: '2026-01-01', rarity: 70 },
  { title: 'Charlie', rarity: 10 },
  { title: 'Delta', rarity: 40 },
]
const TEN: Spec[] = Array.from({ length: 10 }, (_, i) => ({ title: `Item ${i}` }))

const table = () => screen.getByRole('table')
/** The names in the desktop table, in order. */
const names = () => within(table()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
// A filter's name carries its count ("Earned 2"): matched by how it starts.
const filter = (label: string) => within(screen.getByRole('group')).getByRole('button', { name: new RegExp(`^${label}`) })
const column = (label: string) => within(table()).getByRole('button', { name: label })

beforeEach(() => {
  jest.clearAllMocks()
  window.localStorage.clear()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
  for (const p of PLATFORMS) p.pins({ canPin: false })
})
afterEach(() => window.history.replaceState(null, '', '/'))

describe.each(PLATFORMS)('$name', (p) => {
  test('every achievement in the game order, with filters that count and say which is on', () => {
    p.render(FOUR)
    expect(names()).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta'])
    expect(filter(en.gameInfoTable.filterAll)).toHaveTextContent('4')
    fireEvent.click(filter(en.gameInfoTable.filterEarned))
    expect(filter(en.gameInfoTable.filterEarned)).toHaveAttribute('aria-pressed', 'true')
    expect(names()).toEqual(['Alpha', 'Bravo'])
    fireEvent.click(filter(en.gameInfoTable.filterUnearned))
    expect(names()).toEqual(['Charlie', 'Delta'])
  })

  test('earned and locked are said in words, not only shown', () => {
    p.render(FOUR)
    expect(within(table()).getAllByLabelText(p.texts.earned)).toHaveLength(2)
    expect(within(table()).getAllByText(p.texts.locked)).toHaveLength(2)
  })

  test('a filter that leaves nothing says so, with no table', () => {
    p.render([{ title: 'Done', earned: true }])
    fireEvent.click(filter(en.gameInfoTable.filterUnearned))
    expect(screen.getByText(p.texts.none)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  test('the columns sort: rarest first, newest unlock first with the locked last, and back to game order', () => {
    p.render(FOUR)
    fireEvent.click(column(en.gameInfoTable.headerRarity))
    expect(names()).toEqual(['Alpha', 'Charlie', 'Delta', 'Bravo'])
    expect(column(en.gameInfoTable.headerRarity).closest('th')).toHaveAttribute('aria-sort', 'ascending')
    fireEvent.click(column(en.gameInfoTable.headerEarned))
    expect(names()).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta'])
    expect(column(en.gameInfoTable.headerEarned).closest('th')).toHaveAttribute('aria-sort', 'descending')
    fireEvent.click(column(en.gameInfoTable.headerEarned))
    expect(names().slice(0, 2)).toEqual(['Bravo', 'Alpha'])
    expect(column(en.gameInfoTable.headerRarity).closest('th')).toHaveAttribute('aria-sort', 'none')
  })

  test('a search shows every match, and says when there is none', () => {
    p.render(TEN)
    const search = screen.getByRole('searchbox', { name: en.gameInfoTable.searchPlaceholder })
    fireEvent.change(search, { target: { value: 'item 9' } })
    expect(names()).toEqual(['Item 9'])
    fireEvent.change(search, { target: { value: 'zzz' } })
    expect(screen.getByText(en.gameInfoTable.noMatches)).toBeInTheDocument()
  })

  test('a long list shows its first rows, the rest on asking, and folds again', () => {
    p.render(TEN)
    expect(names()).toHaveLength(8)
    fireEvent.click(screen.getByRole('button', { name: en.gameInfoTable.showRest.replace('{n}', '2') }))
    expect(names()).toHaveLength(10)
    fireEvent.click(screen.getByRole('button', { name: en.gameInfoTable.showLess }))
    expect(names()).toHaveLength(8)
  })

  test('a short list has no "show the rest"', () => {
    p.render(FOUR)
    expect(screen.queryByRole('button', { name: /show the other/i })).not.toBeInTheDocument()
  })

  test('each one has a card on the phone, which opens it', async () => {
    p.render(FOUR)
    const cards = screen.getAllByRole('listitem')
    expect(cards).toHaveLength(4)
    fireEvent.click(within(cards[1]).getByRole('button', { name: 'Bravo' }))
    expect(await screen.findByRole('dialog', { name: 'Bravo' })).toBeInTheDocument()
  })

  test('its name is the button that opens it in a detail window', async () => {
    p.render(FOUR)
    fireEvent.click(within(table()).getByRole('button', { name: 'Charlie' }))
    expect(await screen.findByRole('dialog', { name: 'Charlie' })).toBeInTheDocument()
  })

  test('pins one from its row, saying what it does and whether it is pinned', () => {
    const toggle = p.pins({ canPin: true, pinned: [0] })
    p.render(FOUR)
    expect(within(table()).getByRole('button', { name: `${en.favorites.removeFavorite}: Alpha` })).toHaveAttribute('aria-pressed', 'true')
    const star = within(table()).getByRole('button', { name: `${en.favorites.addFavorite}: Bravo` })
    expect(star).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(star)
    expect(toggle.mock.calls[0][0]).toEqual(p.pinArg('Bravo'))
  })

  test('the ones pinned when the page loaded lead; one pinned now stays where it is', () => {
    p.pins({ canPin: true, pinned: [2] })
    p.render(FOUR)
    expect(names()).toEqual(['Charlie', 'Alpha', 'Bravo', 'Delta'])
    cleanup()
    p.pins({ canPin: true, pinned: [2], leading: [] })
    p.render(FOUR)
    expect(names()[0]).toBe('Alpha')
  })
})

describe.each(PLATFORMS)('$name, for someone who cannot pin', (p) => {
  test('has no pin', () => {
    p.render(FOUR)
    expect(screen.queryByRole('button', { name: new RegExp(en.favorites.addFavorite) })).not.toBeInTheDocument()
  })
})

describe.each(PLATFORMS.filter((p) => p.secret))('$name, secret ones', (p) => {
  const SECRET: Spec[] = [{ title: 'Open', earned: true }, { title: 'Spoiler', text: 'The ending', secret: true }]

  test('keep their name and text until earned, in the table, a search and the detail window', () => {
    p.render(SECRET)
    expect(names()).toEqual(['Open', p.secret!.title])
    expect(screen.queryByText('The ending')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: en.gameInfoTable.searchPlaceholder }), { target: { value: 'spoiler' } })
    expect(screen.getByText(en.gameInfoTable.noMatches)).toBeInTheDocument()
  })

  test('open without their text or guide links: a search would give them away', async () => {
    p.render(SECRET)
    fireEvent.click(within(table()).getByRole('button', { name: p.secret!.title }))
    const dialog = await screen.findByRole('dialog', { name: p.secret!.title })
    expect(within(dialog).queryByText('The ending')).toBeNull()
    expect(within(dialog).queryByRole('link')).toBeNull()
  })

  test('once earned, show what they are', () => {
    p.render([{ title: 'Spoiler', text: 'The ending', secret: true, earned: true }])
    expect(names()).toEqual(['Spoiler'])
  })
})

describe.each(PLATFORMS.filter((p) => p.secret?.reveal))('$name, revealing secret ones', (p) => {
  const SECRET: Spec[] = [{ title: 'Open', earned: true }, { title: 'Spoiler', text: 'The ending', secret: true }]

  test('all at once, and hidden again', () => {
    const { all, allOff } = p.secret!.reveal!
    p.render(SECRET)
    fireEvent.click(screen.getByRole('button', { name: all }))
    expect(names()).toContain('Spoiler')
    expect(screen.getAllByText('The ending').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: allOff }))
    expect(names()).toContain(p.secret!.title)
  })

  test('one by one with its eye, and the switch for all follows', () => {
    p.render(SECRET)
    fireEvent.click(within(table()).getByRole('button', { name: p.secret!.reveal!.one }))
    expect(names()).toContain('Spoiler')
    expect(screen.getByRole('button', { name: p.secret!.reveal!.allOff })).toHaveAttribute('aria-pressed', 'true')
  })

  test('no switch when none is left to earn', () => {
    p.render([{ title: 'Spoiler', secret: true, earned: true }])
    expect(screen.queryByRole('button', { name: p.secret!.reveal!.all })).not.toBeInTheDocument()
  })
})

describe.each(PLATFORMS.filter((p) => p.anchor))('$name, opened from a link to one', (p) => {
  test('the row carries the anchor its links point at', () => {
    p.render(FOUR)
    expect(document.getElementById(p.anchor!(2))).toHaveTextContent('Charlie')
  })

  test('shows it whatever the fold and the filter', () => {
    window.history.replaceState(null, '', `/game#${p.anchor!(9)}`)
    p.render(TEN)
    expect(names()).toContain('Item 9')
  })

  test('ignores a link to one the game does not have, and other fragments', () => {
    window.history.replaceState(null, '', `/game#${p.anchor!(99)}`)
    p.render(TEN)
    expect(names()).toHaveLength(8)
    cleanup()
    window.history.replaceState(null, '', '/game#comments')
    p.render(TEN)
    expect(names()).toHaveLength(8)
  })
})

describe.each(PLATFORMS.filter((p) => p.hasNotice))('$name, the line above the table', (p) => {
  test('names the locked ones it is about, and can keep only them', () => {
    p.render([{ title: 'Lose me', noticed: true }, { title: 'Got it', noticed: true, earned: true }, { title: 'Plain' }])
    expect(screen.getByRole('status')).toHaveTextContent('«Lose me»')
    expect(screen.getByRole('status')).not.toHaveTextContent('Got it')
    fireEvent.click(screen.getByRole('button', { name: en.gameInfoTable.showOnlyThese }))
    expect(names()).toEqual(['Lose me'])
    fireEvent.click(screen.getByRole('button', { name: en.gameInfoTable.showAllAgain }))
    expect(names()).toHaveLength(3)
  })
})
