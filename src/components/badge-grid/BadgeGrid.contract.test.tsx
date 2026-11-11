jest.mock('@/hooks/useAchievementPins', () => ({ ...jest.requireActual('@/hooks/useAchievementPins'), useAchievementPins: jest.fn() }))
jest.mock('@/components/achievement-modal/AchievementModal', () => ({
  __esModule: true,
  default: ({ achievement, onClose }: { achievement: { Title: string }; onClose: () => void }) => (
    <div role="dialog" aria-label={achievement.Title}>
      <button onClick={onClose}>close</button>
    </div>
  ),
}))

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { en } from '@/translations/en'
import { useAchievementPins, RA_PINS, STEAM_PINS, PSN_PINS, XBOX_PINS } from '@/hooks/useAchievementPins'
import { mockPins } from '@/test-utils/pins'
import { xboxAchievementFixture } from '@/test-utils/xboxFixtures'
import type { RetroAchievement } from '@/types/types'
import type { SteamAchievementUnified } from '@/types/steam'
import type { PsnTrophy } from '@/types/psn'
import { AchievementGrid } from '@/components/achievement-grid/AchievementGrid'
import { SteamAchievementGrid } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import { PsnTrophyGrid } from '@/components/psn/psn-trophy-grid/PsnTrophyGrid'
import { XboxAchievementGrid } from '@/components/xbox/xbox-achievement-grid/XboxAchievementGrid'

/**
 * What every platform's badge grid promises (the shell, `BadgeGrid`), tested through each adapter as a
 * person uses it. A platform's own extras (PSN's DLC folds and grade, Xbox's gamerscore, Steam's online
 * flag, RA's missables and window) are in its adapter's test.
 */

type Spec = { title: string; earned?: boolean; secret?: boolean; rarity?: number; text?: string; at?: string }

type Platform = {
  name: string
  /** A badge is a link to the achievement's page, or a button that opens its window (RA). */
  role: 'link' | 'button'
  render: (specs: Spec[], opts?: { limit?: number }) => void
  /** The viewer's pins, by place in the list; returns the toggle the stars call. */
  pins?: (o: { canPin: boolean; pinned?: number[] }) => jest.Mock
  /** What the toggle receives for the achievement at that place. */
  pinArg?: (i: number) => unknown
  words: { earned: string; locked: string }
  /** The stand-ins of a secret one; absent where the platform has none (RA). */
  secret?: { title: string; text: string; reveal?: { one: string; off: string } }
}

const day = (at = '2026-01-01') => `${at}T12:00:00Z`

const RA: Platform = {
  name: 'RetroAchievements',
  role: 'button',
  render: (specs, opts) => {
    const list: RetroAchievement[] = specs.map((s, i) => ({
      ID: i + 1, Title: s.title, Description: s.text ?? `${s.title} text`, BadgeName: `b${i}`, Points: 5, TrueRatio: 5,
      NumAwarded: 1, NumAwardedHardcore: 1, Author: 'a', AuthorULID: 'u', DateModified: '', DateCreated: '', DisplayOrder: i + 1,
      MemAddr: '', Type: null, DateEarned: s.earned ? `${s.at ?? '2026-01-01'} 12:00:00` : null, DateEarnedHardcore: null,
    }))
    ;(useAchievementPins as jest.Mock).mockReturnValue(mockPins(RA_PINS.idOf).value)
    render(<AchievementGrid achievements={list} total={list.length} gameId={9} gameTitle="Game" numDistinctPlayers={100} limit={opts?.limit} />)
    // The badges show once their pictures have loaded, or a moment has passed.
    act(() => { jest.advanceTimersByTime(1500) })
  },
  words: { earned: en.steam.earned, locked: en.steam.locked },
}

const STEAM: Platform = {
  name: 'Steam',
  role: 'link',
  render: (specs, opts) => {
    const list: SteamAchievementUnified[] = specs.map((s, i) => ({
      _source: 'steam', id: `A${i}`, apiname: `A${i}`, title: s.title, description: s.text ?? `${s.title} text`, earned: !!s.earned,
      dateEarned: s.earned ? day(s.at) : null, badgeUrl: 'icon.jpg', displayOrder: i, hidden: !!s.secret, globalPct: s.rarity ?? null, likelyOnline: false,
    }))
    render(<SteamAchievementGrid appId={620} gameTitle="Game" achievements={list} limit={opts?.limit} />)
  },
  pins: ({ canPin, pinned = [] }) => {
    const { toggle, value } = mockPins(STEAM_PINS.idOf, { canPin, pinned: pinned.map((i) => `A${i}`) })
    ;(useAchievementPins as jest.Mock).mockReturnValue(value)
    return toggle
  },
  pinArg: (i) => expect.objectContaining({ apiname: `A${i}` }),
  words: { earned: en.steam.earned, locked: en.steam.locked },
  secret: { title: en.steam.hiddenAchievement, text: en.steam.hiddenAchievementDesc },
}

const PSN: Platform = {
  name: 'PlayStation',
  role: 'link',
  render: (specs, opts) => {
    const list: PsnTrophy[] = specs.map((s, i) => ({
      id: i, name: s.title, detail: s.text ?? `${s.title} text`, iconUrl: 'https://i.png', type: 'bronze', groupId: 'default',
      hidden: !!s.secret, earned: !!s.earned, earnedAt: s.earned ? day(s.at) : null, rarity: s.rarity ?? null,
    }))
    render(<PsnTrophyGrid gameId={100} gameTitle="Game" trophies={list} limit={opts?.limit} />)
  },
  pins: ({ canPin, pinned = [] }) => {
    const { toggle, value } = mockPins(PSN_PINS.idOf, { canPin, pinned })
    ;(useAchievementPins as jest.Mock).mockReturnValue(value)
    return toggle
  },
  pinArg: (i) => expect.objectContaining({ id: i }),
  words: { earned: en.psn.earned, locked: en.psn.locked },
  secret: { title: en.psn.hiddenTrophy, text: en.psn.hiddenTrophyDesc, reveal: { one: en.psn.revealTrophy, off: en.psn.concealTrophy } },
}

const XBOX: Platform = {
  name: 'Xbox',
  role: 'link',
  render: (specs, opts) => {
    const list = specs.map((s, i) =>
      xboxAchievementFixture({
        id: String(i), name: s.title, description: s.text ?? `${s.title} text`, iconUrl: 'https://i.png', unlocked: !!s.earned,
        unlockedAt: s.earned ? day(s.at) : null, rarity: s.rarity ?? null, secret: !!s.secret,
      }),
    )
    render(<XboxAchievementGrid gameId={100} gameTitle="Game" achievements={list} limit={opts?.limit} />)
  },
  pins: ({ canPin, pinned = [] }) => {
    const { toggle, value } = mockPins(XBOX_PINS.idOf, { canPin, pinned: pinned.map(String) })
    ;(useAchievementPins as jest.Mock).mockReturnValue(value)
    return toggle
  },
  pinArg: (i) => expect.objectContaining({ id: String(i) }),
  words: { earned: en.xbox.earned, locked: en.xbox.locked },
  secret: { title: en.xbox.secretAchievement, text: en.xbox.secretAchievementDesc, reveal: { one: en.xbox.revealAchievement, off: en.xbox.concealAchievement } },
}

const PLATFORMS = [RA, STEAM, PSN, XBOX]

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  window.localStorage.clear()
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] })
  for (const p of [STEAM, PSN, XBOX]) p.pins?.({ canPin: false })
})
afterEach(() => {
  cleanup()
  jest.useRealTimers()
})

const hover = (el: HTMLElement) => {
  fireEvent.mouseEnter(el, { clientX: 10, clientY: 10 })
  act(() => { jest.advanceTimersByTime(450) })
}

describe.each(PLATFORMS)('$name badge grid', (p) => {
  const badge = (title: string) => screen.getByRole(p.role, { name: new RegExp(`^${title}`) })

  test('has a badge per achievement, in order, each saying whether it is earned', () => {
    p.render([{ title: 'First', earned: true }, { title: 'Second' }])
    const badges = screen.getAllByRole(p.role)
    expect(badges.map((b) => b.getAttribute('aria-label'))).toEqual([
      expect.stringMatching(/^First/),
      expect.stringMatching(/^Second/),
    ])
    expect(badge('First')).toHaveAccessibleName(expect.stringContaining(p.words.earned))
    expect(badge('Second')).toHaveAccessibleName(expect.stringContaining(p.words.locked))
  })

  test('hovering shows its details after a moment, and leaving takes them away', () => {
    p.render([{ title: 'First', earned: true, at: '2025-01-15', text: 'Do the thing' }])
    fireEvent.mouseEnter(badge('First'), { clientX: 10, clientY: 10 })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    act(() => { jest.advanceTimersByTime(450) })
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('First')
    expect(tip).toHaveTextContent('Do the thing')
    expect(tip).toHaveTextContent('Jan 15, 2025')
    fireEvent.mouseLeave(badge('First'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  test('leaving before the moment has passed shows nothing at all', () => {
    p.render([{ title: 'First' }])
    fireEvent.mouseEnter(badge('First'), { clientX: 10, clientY: 10 })
    fireEvent.mouseLeave(badge('First'))
    act(() => { jest.advanceTimersByTime(1000) })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  test('keyboard focus shows the details at once, and blur hides them', () => {
    p.render([{ title: 'First' }])
    act(() => { badge('First').focus() })
    act(() => { jest.advanceTimersByTime(0) })
    expect(screen.getByRole('tooltip')).toHaveTextContent('First')
    expect(screen.getByRole('tooltip')).toHaveTextContent(en.achievement.notEarned)
    act(() => { badge('First').blur() })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  test('a long list shows the first few until asked for the rest', () => {
    p.render(Array.from({ length: 20 }, (_, i) => ({ title: `Title ${i}` })), { limit: 5 })
    expect(screen.getAllByRole(p.role, { name: /^Title [0-9]/ })).toHaveLength(5)
    fireEvent.click(screen.getByRole('button', { name: `Show all 20` }))
    expect(screen.getAllByRole(p.role, { name: /^Title [0-9]/ })).toHaveLength(20)
    fireEvent.click(screen.getByRole('button', { name: en.statusGameItem.showFewerAchievements }))
    expect(screen.getAllByRole(p.role, { name: /^Title [0-9]/ })).toHaveLength(5)
  })

  test('a list that fits is not capped', () => {
    p.render([{ title: 'One' }, { title: 'Two' }], { limit: 5 })
    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument()
  })
})

describe.each(PLATFORMS.filter((p) => p.pins))('$name pins', (p) => {
  const star = (verb: string, title: string) => screen.getByRole('button', { name: `${verb}: ${title}` })

  test('signed out, there is no star', () => {
    p.pins!({ canPin: false })
    p.render([{ title: 'First' }])
    expect(screen.queryByRole('button', { name: new RegExp(en.favorites.addFavorite) })).not.toBeInTheDocument()
  })

  test('a star pins the badge, and says it is pinned once it is', () => {
    const toggle = p.pins!({ canPin: true, pinned: [1] })
    p.render([{ title: 'First' }, { title: 'Second' }])
    expect(star(en.favorites.addFavorite, 'First')).toHaveAttribute('aria-pressed', 'false')
    expect(star(en.favorites.removeFavorite, 'Second')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(star(en.favorites.addFavorite, 'First'))
    expect(toggle).toHaveBeenCalledWith(p.pinArg!(0))
  })
})

describe.each(PLATFORMS.filter((p) => p.secret))('$name secrets', (p) => {
  const secret = p.secret!

  test('a secret one keeps its name and text hidden, in its label and in its details', () => {
    p.render([{ title: 'Spoiler', secret: true, text: 'The ending' }])
    const hidden = screen.getByRole(p.role, { name: new RegExp(`^${secret.title}`) })
    expect(screen.queryByText('Spoiler')).not.toBeInTheDocument()
    hover(hidden)
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent(secret.text)
    expect(tip).not.toHaveTextContent('Spoiler')
    expect(tip).not.toHaveTextContent('The ending')
  })

  test('is shown once earned', () => {
    p.render([{ title: 'Spoiler', secret: true, earned: true }])
    expect(screen.getByRole(p.role, { name: /^Spoiler/ })).toBeInTheDocument()
  })
})

describe.each(PLATFORMS.filter((p) => p.secret?.reveal))('$name eye', (p) => {
  const { reveal } = p.secret!

  test('reveals just that badge, and hides it again', () => {
    p.render([{ title: 'Spoiler', secret: true }, { title: 'Plain' }])
    expect(screen.queryByRole(p.role, { name: /^Spoiler/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: reveal!.one })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: reveal!.one }))
    expect(screen.getByRole(p.role, { name: /^Spoiler/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: reveal!.off })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: reveal!.off }))
    expect(screen.queryByRole(p.role, { name: /^Spoiler/ })).not.toBeInTheDocument()
  })

  test('no eye on a secret one already earned', () => {
    p.render([{ title: 'Spoiler', secret: true, earned: true }])
    expect(screen.queryByRole('button', { name: reveal!.one })).not.toBeInTheDocument()
  })
})

describe.each([RA])('$name window', (p) => {
  test('a badge opens its achievement', async () => {
    p.render([{ title: 'First' }])
    jest.useRealTimers()
    fireEvent.click(screen.getByRole('button', { name: /^First/ }))
    expect(await screen.findByRole('dialog', { name: 'First' })).toBeInTheDocument()
  })
})
