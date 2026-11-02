jest.mock('@/hooks/useXboxFavoriteAchievements', () => ({ useXboxFavoriteAchievements: jest.fn() }))

import { render, screen, fireEvent, act } from '@testing-library/react'
import { XboxAchievementGrid } from './XboxAchievementGrid'
import { en } from '@/translations/en'
import { useXboxFavoriteAchievements } from '@/hooks/useXboxFavoriteAchievements'
import { xboxAchievementFixture } from '@/test-utils/xboxFixtures'

const ACHIEVEMENTS = [
  xboxAchievementFixture({ id: '0', name: 'All of them', gamerscore: 50, iconUrl: 'https://i.png', rarity: 3.4 }),
  xboxAchievementFixture({ id: '1', name: 'Spoiler', description: 'The ending', gamerscore: 25, iconUrl: 'https://j.png', unlocked: false, unlockedAt: null, secret: true }),
]

const toggle = jest.fn()
beforeEach(() => {
  jest.clearAllMocks()
  window.localStorage.clear()
  ;(useXboxFavoriteAchievements as jest.Mock).mockReturnValue({ pinned: new Set<string>(), toggle, canPin: false })
})

test('each achievement links to its row on the game page, saying its gamerscore and state', () => {
  render(<XboxAchievementGrid gameId={1738914043} gameTitle="Game" achievements={ACHIEVEMENTS} />)
  const earned = screen.getByRole('link', { name: `All of them — 50 G, ${en.xbox.earned}` })
  expect(earned).toHaveAttribute('href', '/xboxGame/1738914043#achievement-0')
  // A secret achievement keeps its name hidden until earned.
  expect(screen.getByRole('link', { name: `${en.xbox.secretAchievement} — 25 G, ${en.xbox.locked}` })).toBeInTheDocument()
  expect(screen.queryByText('Spoiler')).not.toBeInTheDocument()
})

test('focusing an achievement shows its details at once', () => {
  render(<XboxAchievementGrid gameId={100} gameTitle="Game" achievements={ACHIEVEMENTS} />)
  jest.useFakeTimers()
  fireEvent.focus(screen.getAllByRole('link')[0])
  act(() => jest.runAllTimers())
  jest.useRealTimers()
  const tip = screen.getByRole('tooltip')
  expect(tip).toHaveTextContent('All of them')
  expect(tip).toHaveTextContent('50 G')
  expect(tip).toHaveTextContent('3.4')
  fireEvent.blur(screen.getAllByRole('link')[0])
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
})

test('a concealed achievement shows the secret text in its tooltip, not its description', () => {
  render(<XboxAchievementGrid gameId={100} gameTitle="Game" achievements={ACHIEVEMENTS} />)
  jest.useFakeTimers()
  fireEvent.focus(screen.getAllByRole('link')[1])
  act(() => jest.runAllTimers())
  jest.useRealTimers()
  const tip = screen.getByRole('tooltip')
  expect(tip).toHaveTextContent(en.xbox.secretAchievementDesc)
  expect(tip).not.toHaveTextContent('The ending')
})

test('a long set shows the first few until asked for the rest', () => {
  const many = Array.from({ length: 20 }, (_, i) => xboxAchievementFixture({ id: String(i), name: `A${i}` }))
  render(<XboxAchievementGrid gameId={100} gameTitle="Game" achievements={many} limit={5} />)
  expect(screen.getAllByRole('link')).toHaveLength(5)
})

test('signed in, a star pins an achievement; no star when it cannot be pinned', () => {
  const { unmount } = render(<XboxAchievementGrid gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  expect(screen.queryByRole('button', { name: new RegExp(en.favorites.addFavorite) })).not.toBeInTheDocument()
  unmount()
  ;(useXboxFavoriteAchievements as jest.Mock).mockReturnValue({ pinned: new Set(['0']), toggle, canPin: true })
  render(<XboxAchievementGrid gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  expect(useXboxFavoriteAchievements).toHaveBeenCalledWith(100, 'Halo')
  expect(screen.getByRole('button', { name: `${en.favorites.removeFavorite}: All of them` })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: `${en.favorites.addFavorite}: ${en.xbox.secretAchievement}` }))
  expect(toggle).toHaveBeenCalledWith(ACHIEVEMENTS[1])
})

test('an eye on a secret, unearned badge reveals just that achievement, and hides it again', () => {
  render(<XboxAchievementGrid gameId={100} gameTitle="Halo" achievements={ACHIEVEMENTS} />)
  expect(screen.queryByRole('link', { name: /^Spoiler/ })).not.toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: en.xbox.revealAchievement })).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: en.xbox.revealAchievement }))
  expect(screen.getByRole('link', { name: /^Spoiler/ })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.xbox.concealAchievement }))
  expect(screen.queryByRole('link', { name: /^Spoiler/ })).not.toBeInTheDocument()
})

test('an achievement with no icon still renders as a grey square', () => {
  const { container } = render(<XboxAchievementGrid gameId={100} gameTitle="Halo" achievements={[xboxAchievementFixture({ iconUrl: null })]} />)
  expect(container.querySelector('img')).toBeNull()
  expect(screen.getAllByRole('link')).toHaveLength(1)
})

test('a tooltip that would run off the right edge opens to the left of the pointer', () => {
  render(<XboxAchievementGrid gameId={100} gameTitle="Game" achievements={ACHIEVEMENTS} />)
  jest.useFakeTimers()
  fireEvent.mouseEnter(screen.getAllByRole('link')[0], { clientX: window.innerWidth - 20, clientY: 100 })
  act(() => jest.runAllTimers())
  jest.useRealTimers()
  expect(screen.getByRole('tooltip').style.transform).toBe('translate(-100%, 0)')
})
