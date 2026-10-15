jest.mock('@/hooks/useAdminXboxAchievements', () => ({ useAdminXboxAchievements: jest.fn() }))

import { render, screen, fireEvent } from '@testing-library/react'
import AdminXboxGame from './AdminXboxGame'
import { useAdminXboxAchievements } from '@/hooks/useAdminXboxAchievements'
import { xboxAchievementFixture, xboxGameFixture } from '@/test-utils/xboxFixtures'

const load = jest.fn()

function set(overrides: Record<string, unknown> = {}) {
  ;(useAdminXboxAchievements as jest.Mock).mockReturnValue({ achievements: null, error: false, loading: false, load, ...overrides })
}

beforeEach(() => {
  jest.clearAllMocks()
  set()
})

test('shows the game, its platforms, progress and gamerscore; the unknown total is not shown as 0', () => {
  render(<ul><AdminXboxGame xuid="1" game={xboxGameFixture()} /></ul>)
  expect(screen.getByText('Modern Game')).toBeInTheDocument()
  expect(screen.getByText(/Xbox Series · PC/)).toBeInTheDocument()
  expect(screen.getByText('14%')).toBeInTheDocument()
  expect(screen.getByText('15 ach.')).toBeInTheDocument()
  expect(screen.getByText('200/1345 G')).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Modern Game progress' })).toBeInTheDocument()
})

test('a known total is shown as earned/total', () => {
  render(<ul><AdminXboxGame xuid="1" game={xboxGameFixture({ maxPossible: 50, totalKnown: true })} /></ul>)
  expect(screen.getByText('15/50 ach.')).toBeInTheDocument()
})

test('a game without art or a last session still renders', () => {
  render(<ul><AdminXboxGame xuid="1" game={xboxGameFixture({ imageIcon: '', lastPlayed: null, platforms: [] })} /></ul>)
  expect(screen.getByText('Unknown platform')).toBeInTheDocument()
})

test('opening it loads the achievements once; closing and reopening does not ask again', () => {
  set({ achievements: [] })
  render(<ul><AdminXboxGame xuid="1" game={xboxGameFixture()} /></ul>)
  const button = screen.getByRole('button', { name: /Modern Game/ })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(button)
  expect(button).toHaveAttribute('aria-expanded', 'true')
  expect(load).not.toHaveBeenCalled()
})

test('asks for the achievements the first time it opens', () => {
  render(<ul><AdminXboxGame xuid="1" game={xboxGameFixture()} /></ul>)
  fireEvent.click(screen.getByRole('button', { name: /Modern Game/ }))
  expect(load).toHaveBeenCalledTimes(1)
})

test('lists the achievements with their state, score and rarity — state in words, not colour only', () => {
  set({
    achievements: [
      xboxAchievementFixture({ id: '1', name: 'Prologue', gamerscore: 10, rarity: 80.5 }),
      xboxAchievementFixture({ id: '2', name: 'Hidden One', unlocked: false, unlockedAt: null, secret: true, rarity: null }),
    ],
  })
  render(<ul><AdminXboxGame xuid="1" game={xboxGameFixture()} /></ul>)
  fireEvent.click(screen.getByRole('button', { name: /Modern Game/ }))
  expect(screen.getByText('Prologue')).toBeInTheDocument()
  expect(screen.getByText('Unlocked')).toBeInTheDocument()
  expect(screen.getByText('Locked')).toBeInTheDocument()
  expect(screen.getByText('(secret)')).toBeInTheDocument()
  expect(screen.getByText('80.5%')).toBeInTheDocument()
})

test('a game with none says so', () => {
  set({ achievements: [] })
  render(<ul><AdminXboxGame xuid="1" game={xboxGameFixture()} /></ul>)
  fireEvent.click(screen.getByRole('button', { name: /Modern Game/ }))
  expect(screen.getByText('This game has no achievements.')).toBeInTheDocument()
})

test('a failure is announced and can be retried', () => {
  set({ error: true })
  render(<ul><AdminXboxGame xuid="1" game={xboxGameFixture()} /></ul>)
  fireEvent.click(screen.getByRole('button', { name: /Modern Game/ }))
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load the achievements')
  load.mockClear()
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(load).toHaveBeenCalledTimes(1)
})

test('while loading, a busy placeholder shows', () => {
  set({ loading: true })
  render(<ul><AdminXboxGame xuid="1" game={xboxGameFixture()} /></ul>)
  fireEvent.click(screen.getByRole('button', { name: /Modern Game/ }))
  expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
})
