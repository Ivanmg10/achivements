import { render, screen, fireEvent } from '@testing-library/react'
import SteamGameItemAchievements from './SteamGameItemAchievements'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { en } from '@/translations/en'
import type { SteamAchievementUnified } from '@/types/steam'

jest.mock('@/hooks/useSteamAchievements', () => ({ useSteamAchievements: jest.fn() }))

const mockRetry = jest.fn()

function ach(overrides: Partial<SteamAchievementUnified> = {}): SteamAchievementUnified {
  return {
    _source: 'steam',
    id: 'A',
    apiname: 'A',
    title: 'Win a Match',
    description: 'Win your first match',
    dateEarned: null,
    badgeUrl: 'gray.jpg',
    displayOrder: 0,
    hidden: false,
    ...overrides,
  }
}

function setHook(overrides: Record<string, unknown> = {}) {
  ;(useSteamAchievements as jest.Mock).mockReturnValue({
    achievements: [],
    isLoading: false,
    error: null,
    retry: mockRetry,
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  setHook()
})

test('asks the hook for this game', () => {
  render(<SteamGameItemAchievements appId={730} />)
  expect(useSteamAchievements).toHaveBeenCalledWith(730)
})

test('shows a busy skeleton while loading', () => {
  setHook({ isLoading: true })
  const { container } = render(<SteamGameItemAchievements appId={730} />)
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
})

test('announces an error with the privacy hint and a retry', () => {
  setHook({ error: 'Failed' })
  render(<SteamGameItemAchievements appId={730} />)

  expect(screen.getByRole('alert')).toHaveTextContent(en.steam.achievementsError)
  expect(screen.getByText(en.steam.privateProfileHint)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: en.steam.retry }))
  expect(mockRetry).toHaveBeenCalledTimes(1)
})

test('says so when the game has no achievements', () => {
  render(<SteamGameItemAchievements appId={730} />)
  expect(screen.getByText(en.steam.noAchievements)).toBeInTheDocument()
})

test('marks earned achievements in text, with the date', () => {
  setHook({ achievements: [ach({ dateEarned: '2024-01-15T12:00:00.000Z', badgeUrl: 'color.jpg' })] })
  const { container } = render(<SteamGameItemAchievements appId={730} />)

  expect(screen.getByText('Win a Match')).toBeInTheDocument()
  expect(screen.getByText(en.steam.earned, { exact: false })).toBeInTheDocument()
  expect(screen.getByText('· 15 Jan 2024', { exact: false })).toBeInTheDocument()
  expect(container.querySelector('img')?.getAttribute('src')).toBe('color.jpg')
})

test('marks an earned achievement with no date as earned', () => {
  setHook({ achievements: [ach({ dateEarned: '' })] })
  render(<SteamGameItemAchievements appId={730} />)
  expect(screen.getByText(en.steam.earned)).toBeInTheDocument()
})

test('marks locked achievements in text, with the grey badge', () => {
  setHook({ achievements: [ach()] })
  const { container } = render(<SteamGameItemAchievements appId={730} />)

  expect(screen.getByText(en.steam.locked)).toBeInTheDocument()
  expect(container.querySelector('img')?.getAttribute('src')).toBe('gray.jpg')
})

test('conceals the text of a hidden achievement until it is earned', () => {
  setHook({ achievements: [ach({ hidden: true, title: 'Spoiler', description: 'The ending' })] })
  render(<SteamGameItemAchievements appId={730} />)

  expect(screen.queryByText('Spoiler')).not.toBeInTheDocument()
  expect(screen.queryByText('The ending')).not.toBeInTheDocument()
  expect(screen.getByText(en.steam.hiddenAchievement)).toBeInTheDocument()
  expect(screen.getByText(en.steam.hiddenAchievementDesc)).toBeInTheDocument()
})

test('reveals a hidden achievement once earned', () => {
  setHook({ achievements: [ach({ hidden: true, title: 'Spoiler', dateEarned: '2024-01-15T12:00:00.000Z' })] })
  render(<SteamGameItemAchievements appId={730} />)
  expect(screen.getByText('Spoiler')).toBeInTheDocument()
})

test('treats badges as decorative and falls back to a placeholder', () => {
  setHook({ achievements: [ach({ id: 'A' }), ach({ id: 'B', badgeUrl: '' })] })
  const { container } = render(<SteamGameItemAchievements appId={730} />)

  const imgs = container.querySelectorAll('img')
  expect(imgs).toHaveLength(1)
  expect(imgs[0].getAttribute('alt')).toBe('')
  expect(container.querySelectorAll('div[aria-hidden="true"]')).toHaveLength(1)
})
