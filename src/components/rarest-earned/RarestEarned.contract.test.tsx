import { render as rtlRender, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { en } from '@/translations/en'
import { SubjectContext } from '@/context/SubjectContext'
import { xboxAchievementFixture } from '@/test-utils/xboxFixtures'
import type { PsnTrophy } from '@/types/psn'
import type { SteamAchievementUnified } from '@/types/steam'
import PsnRarestTrophies from '@/components/psn/psn-rarest-trophies/PsnRarestTrophies'
import XboxRarestAchievements from '@/components/xbox/xbox-rarest-achievements/XboxRarestAchievements'
import SteamRarestAchievements from '@/components/steam/steam-recently-played-expanded/steam-rarest-achievements/SteamRarestAchievements'

/** What a spec says about an achievement, the same for every platform. */
type Spec = { name: string; earned?: boolean; rarity: number | null }
type Options = { isLoading?: boolean; subject?: string }

type Platform = {
  name: string
  render: (specs: Spec[], o?: Options) => void
  /** Where the link to the spec at this index lands, on the game's page or on someone's profile. */
  href: (index: number, subject?: string) => string
  title: string
  empty: string
}

const inSubject = (node: ReactNode, subject?: string) =>
  rtlRender(subject ? <SubjectContext.Provider value={subject}>{node}</SubjectContext.Provider> : <>{node}</>)

const psn = (s: Spec, i: number): PsnTrophy => ({
  id: i, name: s.name, detail: '', iconUrl: null, type: 'bronze', groupId: 'default', hidden: false, earned: s.earned ?? true, earnedAt: null, rarity: s.rarity,
})
const steam = (s: Spec, i: number): SteamAchievementUnified => ({
  _source: 'steam', id: `K${i}`, apiname: `K${i}`, title: s.name, description: '', earned: s.earned ?? true, dateEarned: null, badgeUrl: `${i}.jpg`,
  displayOrder: i, hidden: false, globalPct: s.rarity, likelyOnline: false,
})

const PLATFORMS: Platform[] = [
  {
    name: 'PlayStation',
    render: (specs, o) => inSubject(<PsnRarestTrophies gameId={100} isLoading={o?.isLoading ?? false} trophies={specs.map(psn)} />, o?.subject),
    href: (i, subject) => `${subject ? `/user/${subject}/psn` : '/psnGame'}/NPWR00001_00#trophy-${i}`,
    title: en.psn.rarestEarned,
    empty: en.psn.noneEarned,
  },
  {
    name: 'Xbox',
    render: (specs, o) =>
      inSubject(
        <XboxRarestAchievements
          gameId={100}
          isLoading={o?.isLoading ?? false}
          achievements={specs.map((s, i) => xboxAchievementFixture({ id: String(i), name: s.name, unlocked: s.earned ?? true, rarity: s.rarity }))}
        />,
        o?.subject,
      ),
    href: (i, subject) => `${subject ? `/user/${subject}/xbox` : '/xboxGame'}/100#achievement-${i}`,
    title: en.xbox.rarestEarned,
    empty: en.xbox.noneEarned,
  },
  {
    name: 'Steam',
    render: (specs, o) => inSubject(<SteamRarestAchievements appId={620} isLoading={o?.isLoading ?? false} achievements={specs.map(steam)} />, o?.subject),
    href: (i, subject) => `${subject ? `/user/${subject}/steam` : '/steamGame'}/620#ach-K${i}`,
    title: en.steam.rarestUnlocked,
    empty: en.steam.noneUnlocked,
  },
]

describe.each(PLATFORMS)('$name rarest earned', (p) => {
  test('the rarest earned first; locked ones and ones with no known rarity are left out', () => {
    p.render([
      { name: 'Common', rarity: 80 },
      { name: 'Rare', rarity: 1.5 },
      { name: 'Locked', rarity: 0.1, earned: false },
      { name: 'Unknown', rarity: null },
    ])
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveTextContent(/^Rare/)
    expect(links[1]).toHaveTextContent(/^Common/)
  })

  test('only the four rarest of many', () => {
    p.render(Array.from({ length: 9 }, (_, i) => ({ name: `A${i}`, rarity: i + 1 })))
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(4)
    expect(links[0]).toHaveTextContent(/^A0/)
  })

  test('titled, and each links to its row on the game page', () => {
    p.render([{ name: 'Rare', rarity: 1 }])
    expect(screen.getByText(p.title)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', p.href(0))
  })

  test("on someone's profile the link stays on that profile", () => {
    p.render([{ name: 'Rare', rarity: 1 }], { subject: 'ana' })
    expect(screen.getByRole('link')).toHaveAttribute('href', p.href(0, 'ana'))
  })

  test('says so when nothing is earned', () => {
    p.render([{ name: 'Locked', rarity: 1, earned: false }])
    expect(screen.getByText(p.empty)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('holds its room while loading, with nothing listed', () => {
    p.render([{ name: 'Rare', rarity: 1 }], { isLoading: true })
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })
})
