jest.mock('@/hooks/useXboxFavoriteAchievements', () => ({ useXboxFavoriteAchievements: jest.fn() }))

import { render, screen, fireEvent, within } from '@testing-library/react'
import XboxGameInfoTable from './XboxGameInfoTable'
import { en } from '@/translations/en'
import { useXboxFavoriteAchievements } from '@/hooks/useXboxFavoriteAchievements'
import { xboxAchievementFixture } from '@/test-utils/xboxFixtures'

const ACHIEVEMENTS = [
  xboxAchievementFixture({ id: '10', name: 'Top one', gamerscore: 100, rarity: 2, unlockedAt: '2026-01-03T00:00:00Z' }),
  xboxAchievementFixture({ id: '11', name: 'Common', gamerscore: 10, rarity: 70, unlockedAt: '2026-01-01T00:00:00Z' }),
  xboxAchievementFixture({ id: '12', name: 'Locked', gamerscore: 20, rarity: 10, unlocked: false, unlockedAt: null }),
  xboxAchievementFixture({ id: '13', name: 'Spoiler', description: 'The ending', gamerscore: 5, rarity: null, unlocked: false, unlockedAt: null, secret: true }),
]

const toggle = jest.fn()
beforeEach(() => {
  jest.clearAllMocks()
  window.localStorage.clear()
  window.location.hash = ''
  ;(useXboxFavoriteAchievements as jest.Mock).mockReturnValue({ pinned: new Set<string>(), leading: new Set<string>(), toggle, canPin: false })
})

/** The achievement names in the desktop table, in order. */
const names = () =>
  within(screen.getByRole('table'))
    .getAllByRole('heading', { level: 3 })
    .map((h) => h.textContent)

// A tab's name carries its count ("Earned 2"): matched by how it starts.
const filter = (name: string) => within(screen.getByRole('group')).getByRole('button', { name: new RegExp(`^${name}`) })
const column = (name: string) => within(screen.getByRole('table')).getByRole('button', { name })

test('every achievement in the order Xbox sends them, secret ones kept secret', () => {
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  expect(names()).toEqual(['Top one', 'Common', 'Locked', en.xbox.secretAchievement])
  expect(screen.queryByText('The ending')).not.toBeInTheDocument()
  expect(screen.getAllByText(en.xbox.locked).length).toBeGreaterThan(0)
  expect(screen.getAllByText('100 G').length).toBeGreaterThan(0)
})

test('filters earned and unearned', () => {
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  fireEvent.click(filter(en.gameInfoTable.filterEarned))
  expect(names()).toEqual(['Top one', 'Common'])
  fireEvent.click(filter(en.gameInfoTable.filterUnearned))
  expect(names()).toEqual(['Locked', en.xbox.secretAchievement])
})

test('sorts by rarity, unknown last, and by when earned, newest first and locked last', () => {
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  fireEvent.click(column(en.gameInfoTable.headerRarity))
  expect(names()).toEqual(['Top one', 'Locked', 'Common', en.xbox.secretAchievement])
  fireEvent.click(column(en.gameInfoTable.headerEarned))
  expect(names()).toEqual(['Top one', 'Common', 'Locked', en.xbox.secretAchievement])
})

test('each row carries the anchor its links point at', () => {
  const { container } = render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  expect(container.querySelector('#achievement-12')).toHaveTextContent('Locked')
})

test('signed in, each row can be pinned', () => {
  ;(useXboxFavoriteAchievements as jest.Mock).mockReturnValue({ pinned: new Set<string>(), leading: new Set<string>(), toggle, canPin: true })
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  fireEvent.click(within(screen.getByRole('table')).getByRole('button', { name: `${en.favorites.addFavorite}: Common` }))
  expect(toggle).toHaveBeenCalledWith(ACHIEVEMENTS[1])
})

test('pinned achievements lead the list, highlighted', () => {
  ;(useXboxFavoriteAchievements as jest.Mock).mockReturnValue({ pinned: new Set<string>(['12']), leading: new Set<string>(['12']), toggle, canPin: true })
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  expect(names()).toEqual(['Locked', 'Top one', 'Common', en.xbox.secretAchievement])
  expect(screen.getByRole('table').querySelector('[data-achievement="12"]')!.className).toContain('bg-accent/[0.05]')
})

test('secret achievements can be revealed all at once, and hidden again', () => {
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  fireEvent.click(screen.getByRole('button', { name: en.xbox.showSecretAchievements }))
  expect(names()).toContain('Spoiler')
  expect(screen.getAllByText('The ending').length).toBeGreaterThan(0)
  fireEvent.click(screen.getByRole('button', { name: en.xbox.hideSecretAchievements }))
  expect(names()).toContain(en.xbox.secretAchievement)
})

test('no reveal button when no secret is left to earn', () => {
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={[xboxAchievementFixture({ secret: true, unlocked: true })]} />)
  expect(screen.queryByRole('button', { name: en.xbox.showSecretAchievements })).not.toBeInTheDocument()
})

test('each secret achievement has its own eye, and the global switch follows them', () => {
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  fireEvent.click(within(screen.getByRole('table')).getByRole('button', { name: en.xbox.revealAchievement }))
  expect(names()).toContain('Spoiler')
  expect(screen.getByRole('button', { name: en.xbox.hideSecretAchievements })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(within(screen.getByRole('table')).getByRole('button', { name: en.xbox.concealAchievement }))
  expect(names()).toContain(en.xbox.secretAchievement)
})

test('an achievement opens in a detail window with its gamerscore and guide links', () => {
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo Infinite" achievements={ACHIEVEMENTS} />)
  fireEvent.click(within(screen.getByRole('table')).getByRole('button', { name: 'Common' }))
  const dialog = screen.getByRole('dialog', { name: 'Common' })
  expect(within(dialog).getByText('10 G')).toBeInTheDocument()
  expect(within(dialog).getByRole('link', { name: en.achievementDetail.trueAchievements })).toHaveAttribute(
    'href',
    'https://www.trueachievements.com/searchresults.aspx?search=Halo%20Infinite',
  )
  expect(within(dialog).getByRole('link', { name: en.achievementDetail.youtube }).getAttribute('href')).toContain('Common')
})

test('a secret one still concealed opens without its text or guide links', () => {
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  fireEvent.click(within(screen.getByRole('table')).getByRole('button', { name: en.xbox.secretAchievement }))
  const dialog = screen.getByRole('dialog', { name: en.xbox.secretAchievement })
  expect(within(dialog).queryByText('The ending')).toBeNull()
  expect(within(dialog).queryByRole('link')).toBeNull()
})

test('a long list shows its first rows, and the rest on asking', () => {
  const many = Array.from({ length: 10 }, (_, i) => xboxAchievementFixture({ id: String(i), name: `A${i}` }))
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={many} />)
  expect(names()).toHaveLength(8)
  fireEvent.click(screen.getByRole('button', { name: en.gameInfoTable.showRest.replace('{n}', '2') }))
  expect(names()).toHaveLength(10)
})

test('opening the page from an achievement link lights that row up and shows it whatever the filter', () => {
  window.location.hash = '#achievement-12'
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  expect(screen.getByRole('table').querySelector('[data-achievement="12"]')!.className).toContain('bg-accent/15')
})

test('a filter that matches nothing says so', () => {
  render(<XboxGameInfoTable gameId={100} gameTitle="Halo" achievements={[xboxAchievementFixture({ unlocked: true })]} />)
  fireEvent.click(filter(en.gameInfoTable.filterUnearned))
  expect(screen.getByText(en.xbox.noAchievements)).toBeInTheDocument()
})
