jest.mock('@/hooks/useAchievementPins', () => ({ ...jest.requireActual('@/hooks/useAchievementPins'), useAchievementPins: jest.fn() }))

import { render, screen, fireEvent, act } from '@testing-library/react'
import { SteamAchievementGrid } from './SteamAchievementGrid'
import { useAchievementPins, STEAM_PINS } from '@/hooks/useAchievementPins'
import { mockPins } from '@/test-utils/pins'
import { en } from '@/translations/en'
import type { SteamAchievementUnified } from '@/types/steam'

function ach(overrides: Partial<SteamAchievementUnified> = {}): SteamAchievementUnified {
  return {
    _source: 'steam',
    id: 'WIN',
    apiname: 'WIN',
    title: 'Win a Match',
    description: 'Win your first match',
    earned: false,
    dateEarned: null,
    badgeUrl: 'icon.jpg',
    displayOrder: 0,
    hidden: false,
    globalPct: null,
    likelyOnline: false,
    ...overrides,
  }
}

const hover = () => {
  fireEvent.mouseEnter(screen.getByRole('link'), { clientX: 10, clientY: 10 })
  act(() => { jest.advanceTimersByTime(450) })
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  ;(useAchievementPins as jest.Mock).mockReturnValue(mockPins(STEAM_PINS.idOf, { canPin: false }).value)
})
afterEach(() => jest.useRealTimers())

test('each badge links to its achievement on the game page, and pins against that game', () => {
  render(<SteamAchievementGrid appId={620} gameTitle="Portal 2" achievements={[ach()]} />)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/steamGame/620#ach-WIN')
  expect(useAchievementPins).toHaveBeenCalledWith(STEAM_PINS, 620, 'Portal 2')
})

test('a badge with no image is a placeholder, not a broken picture', () => {
  const { container } = render(<SteamAchievementGrid appId={620} gameTitle="Portal 2" achievements={[ach({ badgeUrl: '' })]} />)
  expect(container.querySelector('img')).toBeNull()
  expect(screen.getAllByRole('link')).toHaveLength(1)
})

test('supports the smaller 40px size', () => {
  const { container } = render(<SteamAchievementGrid appId={620} gameTitle="Portal 2" achievements={[ach()]} badgeSize={40} />)
  expect(container.querySelector('img')?.className).toContain('w-10')
})

test('the tooltip gives the rarity and the day it was earned', () => {
  render(<SteamAchievementGrid appId={620} gameTitle="Portal 2" achievements={[ach({ earned: true, dateEarned: '2024-01-15T12:00:00.000Z', globalPct: 12.34 })]} />)
  hover()
  const tip = screen.getByRole('tooltip')
  expect(tip).toHaveTextContent(`12.3${en.achievement.haveIt}`)
  expect(tip).toHaveTextContent(en.steam.earned)
  expect(tip).toHaveTextContent('Jan 15, 2024')
})

test('the tooltip omits the rarity when Steam gave none', () => {
  render(<SteamAchievementGrid appId={620} gameTitle="Portal 2" achievements={[ach()]} />)
  hover()
  expect(screen.getByRole('tooltip')).not.toHaveTextContent(en.achievement.haveIt)
})

test('a secret achievement keeps its picture, since Steam gives it, but not its text', () => {
  const { container } = render(<SteamAchievementGrid appId={620} gameTitle="Portal 2" achievements={[ach({ hidden: true, title: 'Spoiler' })]} />)
  expect(container.querySelector('img')).not.toBeNull()
  expect(screen.getByRole('link', { name: `${en.steam.hiddenAchievement} — ${en.steam.locked}` })).toBeInTheDocument()
})

test('the tooltip flags an achievement that probably needs online play', () => {
  render(<SteamAchievementGrid appId={620} gameTitle="Portal 2" achievements={[ach({ likelyOnline: true })]} />)
  hover()
  expect(screen.getByRole('tooltip')).toHaveTextContent(en.steam.likelyOnline)
})
